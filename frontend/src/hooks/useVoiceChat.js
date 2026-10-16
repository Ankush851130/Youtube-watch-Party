import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

// Public Google STUN servers for WebRTC audio peer mesh
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
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

  // Current participant in room
  const currentParticipant = room?.participants?.find(p => p.userId === user?.userId);
  const role = user?.role || currentParticipant?.role || 'PARTICIPANT';
  const isHostOrMod = role === 'HOST' || role === 'MODERATOR';
  const isMicAllowed = isHostOrMod || Boolean(currentParticipant?.micAllowed);
  const isMicRequested = Boolean(currentParticipant?.micRequested);

  // Cleanup local audio streams
  const stopLocalAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
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
          // If silence detected, wait 800ms before ducking release
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

  // Connect local stream to WebRTC peers
  const attachLocalStreamToPeers = useCallback((stream) => {
    peersRef.current.forEach((pc) => {
      stream.getTracks().forEach(track => {
        const senders = pc.getSenders();
        const existingSender = senders.find(s => s.track && s.track.kind === track.kind);
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          pc.addTrack(track, stream);
        }
      });
    });
  }, []);

  // WebRTC Peer Connection Helper
  const createPeerConnection = useCallback((remoteUserId) => {
    if (peersRef.current.has(remoteUserId)) {
      return peersRef.current.get(remoteUserId);
    }

    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          sendVoiceSignalSocket(remoteUserId, { candidate: event.candidate });
        }
      };

      // Handle incoming remote audio stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;

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
        audioEl.play().catch(e => console.warn('Autoplay audio blocked until user gesture:', e));
      };

      // If local stream already active, add tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      peersRef.current.set(remoteUserId, pc);
      return pc;
    } catch (err) {
      console.warn('Error creating WebRTC peer:', err);
      return null;
    }
  }, [sendVoiceSignalSocket, socket]);

  // Start Local Microphone
  const startLocalAudio = useCallback(async () => {
    try {
      setAudioError(null);
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
        room.participants.forEach(async (p) => {
          if (p.userId !== user?.userId && p.online) {
            const pc = createPeerConnection(p.userId);
            if (pc) {
              try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendVoiceSignalSocket(p.userId, { offer });
              } catch (e) {
                console.warn('Error creating voice offer:', e);
              }
            }
          }
        });
      }

      addToast('🎙️ Microphone active. Video sound ducks automatically when you speak.', 'success');
    } catch (err) {
      console.error('Mic access error:', err);
      setAudioError(err.message || 'Microphone access denied');
      setIsMicOn(false);
      addToast('Could not access microphone. Please check browser permissions.', 'error');
    }
  }, [addToast, attachLocalStreamToPeers, createPeerConnection, room?.participants, sendVoiceSignalSocket, startVAD, user?.userId]);

  // Toggle Mic on/off or Request Permission
  const handleToggleMic = useCallback(() => {
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
  }, [cancelMicRequestSocket, isMicAllowed, isMicOn, isMicRequested, requestMicSocket, startLocalAudio, stopLocalAudio, addToast]);

  // Handle incoming WebRTC voice signaling
  useEffect(() => {
    if (!socket) return;

    const handleVoiceSignal = async ({ fromUserId, signal }) => {
      if (!fromUserId || !signal) return;
      const pc = createPeerConnection(fromUserId);
      if (!pc) return;

      try {
        if (signal.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendVoiceSignalSocket(fromUserId, { answer });
        } else if (signal.answer) {
          if (pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          }
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn('Error handling voice signal:', err);
      }
    };

    socket.on('voice_signal', handleVoiceSignal);

    return () => {
      socket.off('voice_signal', handleVoiceSignal);
    };
  }, [createPeerConnection, sendVoiceSignalSocket, socket]);

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
