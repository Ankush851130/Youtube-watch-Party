import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

// Public Google and Cloudflare STUN servers for WebRTC audio peer mesh
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ]
};

export function useVoiceChat() {
  const {
    socket,
    room,
    user,
    activeSpeakers,
    isAudioDucked,
    requestMicSocket,
    cancelMicRequestSocket,
    setSpeakingStateSocket,
    sendVoiceSignalSocket,
    addToast
  } = useSocket();

  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakingLocally, setIsSpeakingLocally] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [isPttActive, setIsPttActive] = useState(false);
  const [audioError, setAudioError] = useState(null);

  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isSpeakingRef = useRef(false);

  // WebRTC Peer connections: Map<userId, RTCPeerConnection>
  const peersRef = useRef(new Map());
  // Remote audio elements: Map<userId, HTMLAudioElement>
  const remoteAudiosRef = useRef(new Map());
  // Pending ICE candidates queue: Map<userId, RTCIceCandidateInit[]>
  const pendingCandidatesRef = useRef(new Map());
  // Offer collision tracker: Map<userId, boolean>
  const isMakingOfferRef = useRef(new Map());

  // Current participant in room
  const currentParticipant = room?.participants?.find(p => p.userId === user?.userId);
  const role = user?.role || currentParticipant?.role || 'PARTICIPANT';
  const isHostOrMod = role === 'HOST' || role === 'MODERATOR';
  const isMicAllowed = isHostOrMod || Boolean(currentParticipant?.micAllowed);
  const isMicRequested = Boolean(currentParticipant?.micRequested);

  // User gesture unlock for audio elements blocked by browser autoplay policy
  const unlockAllRemoteAudios = useCallback(() => {
    remoteAudiosRef.current.forEach((audioEl) => {
      if (audioEl && audioEl.paused && audioEl.srcObject) {
        audioEl.play().catch(() => {});
      }
    });
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const events = ['click', 'keydown', 'touchstart', 'pointerdown'];
    events.forEach(evt => window.addEventListener(evt, unlockAllRemoteAudios));
    return () => {
      events.forEach(evt => window.removeEventListener(evt, unlockAllRemoteAudios));
    };
  }, [unlockAllRemoteAudios]);

  // Cleanup local audio streams and set peer transceivers to recvonly
  const stopLocalAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Set audio transceivers to recvonly and detach track so remote peers stop receiving immediately
    peersRef.current.forEach((pc) => {
      try {
        const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
        transceivers.forEach((t) => {
          if (t.sender && t.sender.track) {
            t.sender.replaceTrack(null).catch(() => {});
            t.direction = 'recvonly';
          }
        });
      } catch (e) {}
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      localStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }

    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      setIsSpeakingLocally(false);
      setSpeakingStateSocket(false);
    }
    setIsMicOn(false);
  }, [setSpeakingStateSocket]);

  // If role is demoted or mic allowed revoked, auto-stop mic
  useEffect(() => {
    if (isMicOn && !isMicAllowed) {
      stopLocalAudio();
      addToast('Microphone turned off: Speaking permission was revoked.', 'warning');
    }
  }, [isMicAllowed, isMicOn, stopLocalAudio, addToast]);

  // Voice Activity Detection (VAD) loop
  const startVAD = useCallback((stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(err => console.warn('AudioContext resume warning:', err));
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const SPEECH_THRESHOLD = 14; // Tuned for voice sensitivity vs background hiss

        if (average > SPEECH_THRESHOLD) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setIsSpeakingLocally(true);
            setSpeakingStateSocket(true);
          }
        } else {
          // If silence detected, wait 850ms before releasing ducking
          if (isSpeakingRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              isSpeakingRef.current = false;
              setIsSpeakingLocally(false);
              setSpeakingStateSocket(false);
              silenceTimerRef.current = null;
            }, 850);
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('VAD initialization warning:', err);
    }
  }, [setSpeakingStateSocket]);

  // Drain buffered ICE candidates after setRemoteDescription
  const drainIceCandidates = useCallback(async (remoteUserId, pc) => {
    const queue = pendingCandidatesRef.current.get(remoteUserId);
    if (!queue || queue.length === 0) return;

    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('Error adding buffered ICE candidate:', err);
      }
    }
  }, []);

  // WebRTC Peer Connection Helper
  const createPeerConnection = useCallback((remoteUserId) => {
    if (peersRef.current.has(remoteUserId)) {
      return peersRef.current.get(remoteUserId);
    }

    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Handle local ICE candidates and send to remote peer
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          sendVoiceSignalSocket(remoteUserId, { candidate: event.candidate });
        }
      };

      // Handle incoming remote audio stream
      pc.ontrack = (event) => {
        const remoteStream = (event.streams && event.streams[0])
          ? event.streams[0]
          : new MediaStream([event.track]);

        let audioEl = remoteAudiosRef.current.get(remoteUserId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.playsInline = true;
          audioEl.id = `remote-audio-${remoteUserId}`;
          document.body.appendChild(audioEl);
          remoteAudiosRef.current.set(remoteUserId, audioEl);
        }

        audioEl.srcObject = remoteStream;
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.warn('Autoplay audio blocked by browser policy, will retry on user gesture:', e);
          });
        }
      };

      // Attach local stream if already active, otherwise add recvonly transceiver
      const audioTrack = localStreamRef.current ? localStreamRef.current.getAudioTracks()[0] : null;
      if (audioTrack) {
        pc.addTrack(audioTrack, localStreamRef.current);
      } else {
        try {
          pc.addTransceiver('audio', { direction: 'recvonly' });
        } catch (e) {}
      }

      peersRef.current.set(remoteUserId, pc);
      return pc;
    } catch (err) {
      console.warn('Error creating WebRTC peer:', err);
      return null;
    }
  }, [sendVoiceSignalSocket, socket]);

  // Connect local stream tracks to all established WebRTC peers
  const attachLocalStreamToPeers = useCallback((stream) => {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    peersRef.current.forEach((pc) => {
      try {
        const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
        const audioTransceiver = transceivers.find(t => 
          (t.sender && t.sender.track && t.sender.track.kind === 'audio') ||
          (t.receiver && t.receiver.track && t.receiver.track.kind === 'audio')
        );

        if (audioTransceiver) {
          audioTransceiver.direction = 'sendrecv';
          if (audioTransceiver.sender) {
            audioTransceiver.sender.replaceTrack(audioTrack).catch(err => {
              console.warn('replaceTrack warning:', err);
            });
          }
        } else {
          pc.addTrack(audioTrack, stream);
        }
      } catch (err) {
        console.warn('Error attaching audio track to peer:', err);
      }
    });
  }, []);

  // Send an offer to a specific peer
  const initiateOfferToPeer = useCallback(async (remoteUserId) => {
    const pc = createPeerConnection(remoteUserId);
    if (!pc) return;

    try {
      isMakingOfferRef.current.set(remoteUserId, true);
      const offer = await pc.createOffer();
      if (pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);
      sendVoiceSignalSocket(remoteUserId, { offer });
    } catch (err) {
      console.warn(`Error creating voice offer for user ${remoteUserId}:`, err);
    } finally {
      isMakingOfferRef.current.set(remoteUserId, false);
    }
  }, [createPeerConnection, sendVoiceSignalSocket]);

  // Start Local Microphone
  const startLocalAudio = useCallback(async () => {
    try {
      setAudioError(null);
      unlockAllRemoteAudios();

      // Check Secure Context requirement (HTTPS or localhost)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const isSecure = window.isSecureContext;
        const msg = !isSecure
          ? 'Microphone requires HTTPS or localhost. If opening over LAN IP (e.g. 192.168.x.x), please open via localhost or use HTTPS.'
          : 'Microphone API is not supported in this browser.';
        setAudioError(msg);
        addToast(msg, 'error');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      localStreamRef.current = stream;
      setIsMicOn(true);
      startVAD(stream);
      attachLocalStreamToPeers(stream);

      // Initiate WebRTC offers to all other online participants
      if (room?.participants) {
        room.participants.forEach((p) => {
          if (p.userId !== user?.userId && p.online) {
            initiateOfferToPeer(p.userId);
          }
        });
      }

      addToast('🎙️ Microphone active. Video sound ducks automatically when you speak.', 'success');
    } catch (err) {
      console.error('Mic access error:', err);
      setAudioError(err.message || 'Microphone access denied');
      setIsMicOn(false);
      addToast('Could not access microphone: ' + (err.message || 'Check browser permissions'), 'error');
    }
  }, [addToast, attachLocalStreamToPeers, initiateOfferToPeer, room?.participants, startVAD, unlockAllRemoteAudios, user?.userId]);

  // Automatically connect to newly joined participants if local mic is on
  useEffect(() => {
    if (!isMicOn || !localStreamRef.current || !room?.participants) return;

    room.participants.forEach((p) => {
      if (p.userId !== user?.userId && p.online && !peersRef.current.has(p.userId)) {
        initiateOfferToPeer(p.userId);
      }
    });
  }, [room?.participants, isMicOn, user?.userId, initiateOfferToPeer]);

  // Toggle Mic on/off or Request Permission
  const handleToggleMic = useCallback(() => {
    unlockAllRemoteAudios();

    if (isMicOn) {
      stopLocalAudio();
      addToast('Microphone turned off.', 'info');
      return;
    }

    if (!isMicAllowed) {
      if (isMicRequested) {
        cancelMicRequestSocket();
        addToast('Speaking request cancelled.', 'info');
      } else {
        requestMicSocket();
        addToast('✋ Request to speak sent to Host & Moderators.', 'info');
      }
      return;
    }

    // Has permission, start mic
    startLocalAudio();
  }, [cancelMicRequestSocket, isMicAllowed, isMicOn, isMicRequested, requestMicSocket, startLocalAudio, stopLocalAudio, unlockAllRemoteAudios, addToast]);

  // Handle incoming WebRTC voice signaling with candidate buffering & collision safety
  useEffect(() => {
    if (!socket) return;

    const handleVoiceSignal = async ({ fromUserId, signal }) => {
      if (!fromUserId || !signal) return;
      const pc = createPeerConnection(fromUserId);
      if (!pc) return;

      try {
        if (signal.offer) {
          const localUserId = user?.userId || socket.id || '';
          const isPolite = localUserId.localeCompare(fromUserId) < 0;
          const offerCollision = pc.signalingState !== 'stable' || isMakingOfferRef.current.get(fromUserId);

          if (offerCollision) {
            if (!isPolite) {
              return; // Ignore the collision offer, higher ID takes precedence
            }
            await pc.setLocalDescription({ type: 'rollback' }).catch(() => {});
          }

          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          await drainIceCandidates(fromUserId, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendVoiceSignalSocket(fromUserId, { answer });
        } else if (signal.answer) {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
            await drainIceCandidates(fromUserId, pc);
          }
        } else if (signal.candidate) {
          // If remote description is already set, add immediately; otherwise buffer
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(signal.candidate);
            } catch (err) {
              console.warn('Error adding ICE candidate:', err);
            }
          } else {
            if (!pendingCandidatesRef.current.has(fromUserId)) {
              pendingCandidatesRef.current.set(fromUserId, []);
            }
            pendingCandidatesRef.current.get(fromUserId).push(signal.candidate);
          }
        }
      } catch (err) {
        console.warn('Error handling voice signal:', err);
      }
    };

    socket.on('voice_signal', handleVoiceSignal);

    return () => {
      socket.off('voice_signal', handleVoiceSignal);
    };
  }, [createPeerConnection, drainIceCandidates, sendVoiceSignalSocket, socket, user?.userId]);

  // Handle participants leaving to clean up peer connections
  useEffect(() => {
    if (!socket) return;

    const handleUserLeft = (data) => {
      const leftUserId = data?.userId;
      if (!leftUserId) return;

      const pc = peersRef.current.get(leftUserId);
      if (pc) {
        pc.close();
        peersRef.current.delete(leftUserId);
      }

      const audioEl = remoteAudiosRef.current.get(leftUserId);
      if (audioEl) {
        audioEl.srcObject = null;
        if (audioEl.parentNode) audioEl.parentNode.removeChild(audioEl);
        remoteAudiosRef.current.delete(leftUserId);
      }

      pendingCandidatesRef.current.delete(leftUserId);
      isMakingOfferRef.current.delete(leftUserId);
    };

    socket.on('user_left', handleUserLeft);

    return () => {
      socket.off('user_left', handleUserLeft);
    };
  }, [socket]);

  // Clean up remote audios and peer connections when leaving
  useEffect(() => {
    return () => {
      stopLocalAudio();
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      remoteAudiosRef.current.forEach(el => {
        el.srcObject = null;
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      remoteAudiosRef.current.clear();
      pendingCandidatesRef.current.clear();
      isMakingOfferRef.current.clear();
    };
  }, [stopLocalAudio]);

  // Push-to-Talk Keyboard Listeners (Spacebar)
  useEffect(() => {
    if (!isPushToTalk) return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        // Ignore if user is typing in chat or input
        const targetTag = e.target?.tagName?.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea' || e.target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        if (!isPttActive) {
          setIsPttActive(true);
          if (isMicAllowed && !isMicOn) {
            startLocalAudio();
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        const targetTag = e.target?.tagName?.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea' || e.target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        setIsPttActive(false);
        if (isMicOn) {
          stopLocalAudio();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk, isPttActive, isMicAllowed, isMicOn, startLocalAudio, stopLocalAudio]);

  return {
    isMicOn,
    isSpeakingLocally,
    isAudioDucked,
    activeSpeakers,
    isHostOrMod,
    isMicAllowed,
    isMicRequested,
    isPushToTalk,
    setIsPushToTalk,
    isPttActive,
    audioError,
    toggleMic: handleToggleMic,
    requestToSpeak: requestMicSocket,
    cancelRequest: cancelMicRequestSocket,
    stopLocalAudio
  };
}
