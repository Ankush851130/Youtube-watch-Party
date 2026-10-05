import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

export default function YouTubePlayer({ videoId, isPlaying, currentTime, onOpenSearch, onOpenPasteUrl }) {
  const { room, user, connectionState, playSocket, pauseSocket, seekSocket, changeVideoSocket, changeSpeedSocket, floatingEmojis, addToast } = useSocket();

  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const qualityMenuRef = useRef(null);
  const speedMenuRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const isApiLoadedRef = useRef(false);
  const isSettingStateFromRemoteRef = useRef(false);

  const [playerState, setPlayerState] = useState(-1);
  const [duration, setDuration] = useState(0);
  const [localCurrentTime, setLocalCurrentTime] = useState(currentTime || 0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [embedError, setEmbedError] = useState(null); // null | 'EMBED_RESTRICTED' | 'NOT_FOUND' | 'INVALID_ID' | 'GENERIC'
  const [useFallbackIframe, setUseFallbackIframe] = useState(false);
  const [needsUnmute, setNeedsUnmute] = useState(false);

  // Auto-hide controls state (YouTube style)
  const [showControls, setShowControls] = useState(true);

  // Video Quality Control State
  const [quality, setQuality] = useState('auto');
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  // Video Playback Speed Control State
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  const userRole = user?.role || 'PARTICIPANT';
  const canControl = userRole === 'HOST' || userRole === 'MODERATOR';

  const qualityLabelMap = {
    highres: '4K / 2160p',
    hd1440: '1440p 2K',
    hd1080: '1080p HD',
    hd720: '720p HD',
    large: '480p SD',
    medium: '360p SD',
    small: '240p Low',
    tiny: '144p Saver',
    auto: 'Auto'
  };

  const qualityOptions = [
    { value: 'auto', label: 'Auto (Recommended)' },
    { value: 'highres', label: '2160p (4K Ultra HD)' },
    { value: 'hd1080', label: '1080p (Full HD)' },
    { value: 'hd720', label: '720p (HD)' },
    { value: 'large', label: '480p (Standard)' },
    { value: 'medium', label: '360p (Medium)' },
    { value: 'small', label: '240p (Low)' },
    { value: 'tiny', label: '144p (Data Saver)' }
  ];

  const speedOptions = [
    { value: 0.25, label: '0.25x (Super Slow)' },
    { value: 0.5, label: '0.5x (Slow Motion)' },
    { value: 0.75, label: '0.75x (Slightly Slow)' },
    { value: 1, label: '1.0x (Normal Speed)' },
    { value: 1.25, label: '1.25x (Fast)' },
    { value: 1.5, label: '1.5x (Faster)' },
    { value: 1.75, label: '1.75x (Super Fast)' },
    { value: 2, label: '2.0x (Double Speed)' }
  ];

  // Auto-hide controls logic
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (isPlaying && !isQualityMenuOpen && !isSpeedMenuOpen) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  const handleMouseMoveOnPlayer = () => {
    resetHideTimer();
  };

  const handleMouseLeavePlayer = () => {
    if (isPlaying && !isQualityMenuOpen && !isSpeedMenuOpen) {
      setShowControls(false);
    }
  };

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isPlaying, isQualityMenuOpen, isSpeedMenuOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target)) {
        setIsQualityMenuOpen(false);
      }
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target)) {
        setIsSpeedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset errors when videoId changes
  useEffect(() => {
    setEmbedError(null);
    setUseFallbackIframe(false);
  }, [videoId]);

  // Load YouTube IFrame API script with fail-safe polling & auto-fallback
  useEffect(() => {
    let checkInterval = null;
    let fallbackTimeout = null;

    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    if (!document.getElementById('youtube-iframe-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback();
      initPlayer();
    };

    // Poll for window.YT in case onYouTubeIframeAPIReady was already called earlier
    checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player && !playerRef.current) {
        initPlayer();
        if (checkInterval) clearInterval(checkInterval);
      }
    }, 150);

    // If after 3.5s window.YT is not ready, switch to fallback iframe to guarantee video visibility
    fallbackTimeout = setTimeout(() => {
      if (!isApiLoadedRef.current && !playerRef.current) {
        console.warn('YouTube JS API loading delayed or blocked. Enabling fallback embed for guaranteed playback.');
        setUseFallbackIframe(true);
      }
    }, 3500);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, [videoId]);

  const initPlayer = () => {
    if (playerRef.current || !containerRef.current || !window.YT || !window.YT.Player) return;

    const targetVideoId = videoId;
    if (!targetVideoId) return;

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: targetVideoId,
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          playsinline: 1
        },
        events: {
          onReady: (event) => {
            isApiLoadedRef.current = true;
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(volume);

            const loadedData = typeof event.target.getVideoData === 'function' ? event.target.getVideoData() : null;
            const currentLoadedId = loadedData?.video_id;

            isSettingStateFromRemoteRef.current = true;

            if (targetVideoId && currentLoadedId && currentLoadedId !== targetVideoId) {
              event.target.loadVideoById({
                videoId: targetVideoId,
                startSeconds: currentTime || 0,
                suggestedQuality: quality
              });
            } else if (currentTime > 0) {
              event.target.seekTo(currentTime, true);
            }

            if (isPlaying) {
              attemptPlay(event.target);
            } else {
              event.target.pauseVideo();
            }

            setTimeout(() => {
              isSettingStateFromRemoteRef.current = false;
            }, 1200);

            try {
              const currentQ = event.target.getPlaybackQuality();
              if (currentQ) setQuality(currentQ);
            } catch (e) { }
          },
          onStateChange: (event) => {
            setPlayerState(event.data);

            if (isSettingStateFromRemoteRef.current) return;

            if (event.data === window.YT.PlayerState.PLAYING) {
              setEmbedError(null);
              if (canControl) {
                const curTime = event.target.getCurrentTime();
                playSocket(curTime);
              } else {
                if (!isPlaying) {
                  event.target.pauseVideo();
                  addToast("Playback is locked to Host / Moderator", "warning");
                }
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              if (canControl) {
                const curTime = event.target.getCurrentTime();
                pauseSocket(curTime);
              }
            }
          },
          onError: (event) => {
            console.warn('YouTube Player API Error Code:', event.data);
            if (event.data === 101 || event.data === 150) {
              setEmbedError('EMBED_RESTRICTED');
            } else if (event.data === 100) {
              setEmbedError('NOT_FOUND');
            } else if (event.data === 2 || event.data === 5) {
              setEmbedError('INVALID_ID');
            } else {
              setEmbedError('GENERIC');
            }
          }
        }
      });
    } catch (err) {
      console.warn('Failed to initialize YouTube Player:', err);
      setUseFallbackIframe(true);
    }
  };

  const attemptPlay = (player) => {
    if (!player) return;
    try {
      player.playVideo();
      try {
        player.unMute();
        player.setVolume(volume || 80);
      } catch (e) {}

      setTimeout(() => {
        try {
          if (typeof player.getPlayerState === 'function') {
            const state = player.getPlayerState();
            const isPlayerMuted = typeof player.isMuted === 'function' ? player.isMuted() : false;

            // If state is not PLAYING (1) or BUFFERING (3), browser blocked unmuted autoplay
            if (state !== 1 && state !== 3) {
              console.warn('Autoplay restricted by browser policy. Falling back to muted playback.');
              player.mute();
              setIsMuted(true);
              setNeedsUnmute(true);
              player.playVideo();
            } else if (isPlayerMuted) {
              setIsMuted(true);
              setNeedsUnmute(true);
            } else {
              setIsMuted(false);
              setNeedsUnmute(false);
            }
          }
        } catch (err) {}
      }, 300);
    } catch (err) {
      try {
        player.mute();
        setIsMuted(true);
        setNeedsUnmute(true);
        player.playVideo();
      } catch (e) {}
    }
  };

  // Sync Video ID changes from remote socket
  useEffect(() => {
    if (!playerRef.current || !isApiLoadedRef.current || !videoId) return;

    try {
      setEmbedError(null);
      const targetVideoId = videoId;
      const loadedData = typeof playerRef.current.getVideoData === 'function' ? playerRef.current.getVideoData() : null;
      const currentLoadedId = loadedData?.video_id;
      if (currentLoadedId !== targetVideoId) {
        isSettingStateFromRemoteRef.current = true;
        playerRef.current.loadVideoById({
          videoId: targetVideoId,
          startSeconds: 0,
          suggestedQuality: quality
        });

        // Always attempt to unmute and sync volume when a new song is loaded
        setTimeout(() => {
          if (playerRef.current) {
            try {
              playerRef.current.unMute();
              playerRef.current.setVolume(volume || 80);
              const currentlyMuted = typeof playerRef.current.isMuted === 'function' && playerRef.current.isMuted();
              if (currentlyMuted) {
                setIsMuted(true);
                setNeedsUnmute(true);
              } else {
                setIsMuted(false);
                setNeedsUnmute(false);
              }
            } catch (e) {
              setNeedsUnmute(true);
            }
          }
          isSettingStateFromRemoteRef.current = false;
        }, 500);
      }
    } catch (err) {
      console.warn('Error loading video by ID:', err);
    }
  }, [videoId]);

  // Sync real video title & channel from YouTube API whenever loaded
  useEffect(() => {
    if (!playerRef.current || !isApiLoadedRef.current) return;

    const checkAndSyncTitle = () => {
      try {
        const loadedData = typeof playerRef.current.getVideoData === 'function' ? playerRef.current.getVideoData() : null;
        if (loadedData?.title && canControl) {
          const currentTitle = room?.videoTitle || room?.currentVideoTitle;
          const currentChannel = room?.channelTitle || room?.currentChannelTitle;
          if (!currentTitle || currentTitle !== loadedData.title || !currentChannel || currentTitle.startsWith('YouTube Video (')) {
            changeVideoSocket(videoId, loadedData.title, loadedData.author || 'YouTube Channel');
          }
        }
      } catch (err) {
        // ignore
      }
    };

    const timer = setTimeout(checkAndSyncTitle, 400);
    return () => clearTimeout(timer);
  }, [videoId, playerState]);

  // Sync Remote Play / Pause & Live Seek Drift Correction
  useEffect(() => {
    if (!playerRef.current || !isApiLoadedRef.current) return;

    isSettingStateFromRemoteRef.current = true;

    try {
      const playerTime = typeof playerRef.current.getCurrentTime === 'function' ? (playerRef.current.getCurrentTime() || 0) : 0;
      const drift = Math.abs(playerTime - (currentTime || 0));

      if (drift > 1.2 && currentTime >= 0) {
        playerRef.current.seekTo(currentTime, true);
      }

      if (isPlaying) {
        attemptPlay(playerRef.current);
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (err) {
      console.warn('Error in sync play/pause effect:', err);
    }

    const timer = setTimeout(() => {
      isSettingStateFromRemoteRef.current = false;
    }, 700);

    return () => clearTimeout(timer);
  }, [isPlaying, currentTime]);

  // Sync Video Playback Speed changes from remote socket across all devices
  useEffect(() => {
    const targetSpeed = room?.playbackSpeed || 1;
    setPlaybackSpeed(targetSpeed);

    if (playerRef.current && isApiLoadedRef.current) {
      try {
        if (typeof playerRef.current.getPlaybackRate === 'function') {
          const currentRate = playerRef.current.getPlaybackRate();
          if (currentRate !== targetSpeed && typeof playerRef.current.setPlaybackRate === 'function') {
            playerRef.current.setPlaybackRate(targetSpeed);
          }
        }
      } catch (err) {
        console.warn('Error setting synced playback rate:', err);
      }
    }
  }, [room?.playbackSpeed]);

  // Track progress bar time locally
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isApiLoadedRef.current) {
        try {
          const cur = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setLocalCurrentTime(cur);
          if (dur > 0 && dur !== duration) setDuration(dur);
        } catch (e) {
          // ignore
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [duration]);

  const handleUserClickToUnmute = () => {
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume || 80);
        setIsMuted(false);
        setNeedsUnmute(false);
        if (typeof currentTime === 'number' && currentTime > 0) {
          playerRef.current.seekTo(currentTime, true);
        }
        if (isPlaying) {
          attemptPlay(playerRef.current);
        }
        addToast("🔊 Speaker enabled & audio synchronized!", "success");
      } catch (e) { }
    }
  };

  // Auto-unmute on any user interaction anywhere on the page when speaker needs unmute
  useEffect(() => {
    if (!needsUnmute) return;

    const handleGlobalUserGesture = () => {
      if (playerRef.current) {
        try {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume || 80);
          setIsMuted(false);
          setNeedsUnmute(false);
          addToast("🔊 Speaker enabled & audio synchronized!", "success");
        } catch (e) {}
      }
    };

    window.addEventListener('click', handleGlobalUserGesture, { capture: true, once: true });
    window.addEventListener('touchstart', handleGlobalUserGesture, { capture: true, once: true });

    return () => {
      window.removeEventListener('click', handleGlobalUserGesture, { capture: true });
      window.removeEventListener('touchstart', handleGlobalUserGesture, { capture: true });
    };
  }, [needsUnmute, volume]);

  // Playback Control Triggers
  const handleTogglePlay = () => {
    if (!canControl) {
      addToast("Playback controls are locked to Host or Moderator.", "warning");
      return;
    }

    if (needsUnmute) {
      handleUserClickToUnmute();
    }

    if (isPlaying) {
      pauseSocket(localCurrentTime);
    } else {
      playSocket(localCurrentTime);
    }
  };

  const handleSeekRailClick = (e) => {
    if (!canControl) {
      addToast("Seek control is restricted to Host or Moderator.", "warning");
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;

    setLocalCurrentTime(targetTime);
    seekSocket(targetTime, isPlaying);
  };

  const handleSkipSeconds = (seconds) => {
    if (!canControl) {
      addToast("Restricted to Host or Moderator.", "warning");
      return;
    }
    const newTime = Math.max(0, Math.min(duration, localCurrentTime + seconds));
    setLocalCurrentTime(newTime);
    seekSocket(newTime, isPlaying);
  };

  const handleVolumeToggle = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      setNeedsUnmute(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      if (val === 0) setIsMuted(true);
      else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        setNeedsUnmute(false);
      }
    }
  };

  // Change Video Playback Quality
  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    setIsQualityMenuOpen(false);

    if (playerRef.current) {
      try {
        if (typeof playerRef.current.setPlaybackQuality === 'function') {
          playerRef.current.setPlaybackQuality(newQuality);
        }
        const label = qualityLabelMap[newQuality] || newQuality;
        addToast(`Video quality set to ${label}`, 'success');
      } catch (err) {
        console.warn('Set playback quality error:', err);
      }
    }
  };

  // Change Video Playback Speed (Host / Moderator action - synced via socket to all devices)
  const handleSpeedChange = (newSpeed) => {
    if (!canControl) {
      addToast("Playback speed control is restricted to Host or Moderator.", "warning");
      return;
    }

    setPlaybackSpeed(newSpeed);
    setIsSpeedMenuOpen(false);

    // Broadcast speed change to all devices in the room via socket
    changeSpeedSocket(newSpeed);

    if (playerRef.current) {
      try {
        if (typeof playerRef.current.setPlaybackRate === 'function') {
          playerRef.current.setPlaybackRate(newSpeed);
        }
      } catch (err) {
        console.warn('Set playback rate error:', err);
      }
    }
  };

  const handleToggleFullscreen = () => {
    const frame = document.getElementById('playerOuterFrame');
    if (!frame) return;

    if (!document.fullscreenElement) {
      frame.requestFullscreen?.().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(err => console.log(err));
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (localCurrentTime / duration) * 100) : 0;
  const isControlsVisible = showControls || !isPlaying || isQualityMenuOpen || isSpeedMenuOpen;
  
  const activeVideoId = videoId || 'GG1_DsScm6U';

  return (
    <div
      id="playerOuterFrame"
      onMouseMove={handleMouseMoveOnPlayer}
      onMouseLeave={handleMouseLeavePlayer}
      onClick={needsUnmute ? handleUserClickToUnmute : undefined}
      className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/90 border border-white/[0.08] group select-none transition-all ${isControlsVisible ? 'cursor-default' : 'cursor-none'
        }`}
    >
      {/* YouTube Player Container */}
      {!useFallbackIframe ? (
        <div className="w-full h-full">
          <div ref={containerRef} className="w-full h-full"></div>
        </div>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=${isPlaying ? 1 : 0}&start=${Math.floor(currentTime || 0)}`}
          title="YouTube Watch Party Fallback Stream"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}

      {/* Default Watch Party Poster Screen (When no video is selected yet) */}
      {!videoId && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center overflow-hidden group select-none">
          {/* Background Poster Image */}
          <img
            src="/default-poster.jpg"
            alt="Watch Party Default Poster"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-transform duration-700 group-hover:scale-105"
          />

          {/* Dark Aesthetic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 backdrop-blur-[2px]"></div>

          {/* Center Glassmorphic Action Card */}
          <div className="relative z-10 p-6 sm:p-8 max-w-xl text-center space-y-4 bg-black/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl mx-4 animate-fade-in">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#FF0000]/20 border border-[#FF0000]/50 mx-auto flex items-center justify-center text-[#FF0000] shadow-[0_0_25px_rgba(255,0,0,0.5)] animate-pulse">
              <span className="material-symbols-outlined text-[32px] sm:text-[40px]">play_circle</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                Watch Together, From Anywhere
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {canControl
                  ? "Search or paste any YouTube video link to start synchronized live playback for everyone!"
                  : "Waiting for Host to pick a video. Live synchronized playback will start automatically!"}
              </p>
            </div>

            {canControl ? (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={onOpenSearch}
                  className="px-6 py-3 rounded-full bg-[#FF0000] hover:bg-[#CC0000] active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,0,0,0.6)] border border-white/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
                >
                  <span className="material-symbols-outlined text-[20px]">search</span>
                  <span>Search YouTube Video</span>
                </button>

                {onOpenPasteUrl && (
                  <button
                    onClick={onOpenPasteUrl}
                    className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 backdrop-blur-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">link</span>
                    <span>Paste YouTube URL</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF0000]/15 border border-[#FF0000]/30 text-[#FF4D4D] text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#FF0000]"></span>
                <span>Room Ready • Waiting for Host to Select Video</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Autoplay Speaker Enable Pop-Up Modal Overlay */}
      {needsUnmute && !embedError && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 p-4 flex flex-col items-center justify-center text-center text-white gap-4 animate-fade-in select-none">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF0000]/20 border-2 border-[#FF0000]/60 flex items-center justify-center text-[#FF0000] shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-pulse">
              <span className="material-symbols-outlined text-[34px] sm:text-[42px]">volume_up</span>
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0000] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF0000]"></span>
            </span>
          </div>

          <div className="max-w-md space-y-1.5 px-2">
            <h3 className="text-lg sm:text-2xl font-display font-extrabold text-white tracking-tight">
              Host Changed the Song!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Browser security policy muted audio for the new song. Tap anywhere or click below to enable your speaker and sync playback.
            </p>
          </div>

          <button
            onClick={handleUserClickToUnmute}
            className="mt-1 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#FF0000] hover:bg-[#CC0000] active:scale-95 text-white font-extrabold text-xs sm:text-base shadow-[0_0_25px_rgba(255,0,0,0.6)] border border-white/20 flex items-center gap-2.5 transition-all cursor-pointer hover:scale-105"
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">volume_up</span>
            <span>Enable Speaker Now</span>
          </button>
        </div>
      )}

      {/* Embed Restriction Error Overlay Card */}
      {embedError && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-40 p-6 flex flex-col items-center justify-center text-center text-white gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF0000]/20 border border-[#FF0000]/40 flex items-center justify-center text-[#FF4D4D] shadow-xl">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-white">Video Embedding Restricted</h3>
            <p className="text-xs text-slate-300">
              {embedError === 'EMBED_RESTRICTED'
                ? 'The owner of this YouTube song has disabled playback on embedded players (Error 150/101).'
                : embedError === 'NOT_FOUND'
                  ? 'This video is private or was removed from YouTube.'
                  : 'Unable to embed this YouTube stream.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={`https://www.youtube.com/watch?v=${activeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
            >
              <span>Watch on YouTube</span>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>

            <button
              onClick={() => setUseFallbackIframe(true)}
              className="px-4 py-2 rounded-xl bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#4ade80] text-xs font-semibold flex items-center gap-1.5 border border-[#22C55E]/30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              <span>Try Fallback Embed</span>
            </button>

            {canControl && onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="px-4 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#FF0000]/30 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Switch Song</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Vignette Overlay */}
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'
        }`}></div>

      {/* Bottom Vignette Overlay */}
      <div className={`absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'
        }`}></div>

      {/* Top-Left Source Bug & Active Quality Indicator */}
      <div className={`absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-medium transition-all duration-300 ${isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}>
        <span className="w-2 h-2 rounded-full bg-[#FF0000]"></span>
        <span className="text-white font-semibold">YouTube Stream</span>
        <span className="text-[#FF8080] font-mono text-[11px] font-bold">• Auto (Adaptive)</span>
        <span className="text-amber-400 font-mono text-[11px] font-bold">• {playbackSpeed}x</span>
      </div>

      {/* Top-Right Live Sync Telemetry Pill */}
      <div className={`absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#22C55E]/30 text-xs shadow-lg transition-all duration-300 ${isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}>
        <span className={`w-2 h-2 rounded-full ${connectionState === 'Connected' ? 'bg-[#22C55E] shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-amber-400'}`}></span>
        <span className={`${connectionState === 'Connected' ? 'text-[#4ade80]' : 'text-amber-400'} font-medium text-xs tracking-wide`}>
          {connectionState === 'Connected' ? 'Synced' : connectionState}
        </span>
      </div>

      {/* Floating Reaction Overlay Stream */}
      <div className="absolute bottom-24 right-6 pointer-events-none flex flex-col items-center gap-2 z-20">
        {floatingEmojis.map((item) => (
          <div key={item.id} className="animate-float-reaction text-2xl select-none">
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Controls Bar - YouTube Style Auto-Hiding Controls */}
      <div className={`absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 bg-[#121212]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-2.5 flex flex-col gap-2 shadow-2xl transition-all duration-300 z-30 ${isControlsVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}>
        {/* Scrubber Rail */}
        <div
          onClick={handleSeekRailClick}
          className="relative w-full py-1 cursor-pointer group/rail flex items-center"
        >
          <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden relative">
            <div
              style={{ width: `${progressPercent}%` }}
              className="absolute left-0 top-0 bottom-0 bg-[#FF0000] rounded-full transition-all duration-150"
            ></div>
          </div>
          {/* Red Scrubber Handle */}
          <div
            style={{ left: `${progressPercent}%` }}
            className="absolute -top-1 -ml-1.5 w-3.5 h-3.5 bg-[#FF0000] rounded-full shadow-[0_0_12px_rgba(255,0,0,0.9)] ring-2 ring-black pointer-events-none opacity-0 group-hover/rail:opacity-100 scale-50 group-hover/rail:scale-125 transition-all duration-200"
          ></div>
          <div
            style={{ left: `${progressPercent}%` }}
            className="absolute -top-8 -translate-x-1/2 bg-black/90 px-2 py-0.5 rounded text-[11px] font-mono text-slate-200 border border-white/10 hidden group-hover/rail:block pointer-events-none"
          >
            {formatTime(localCurrentTime)}
          </div>
        </div>

        {/* Lower Toolbar */}
        <div className="flex items-center justify-between gap-3 text-slate-300">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className={`w-9 h-9 rounded-full ${canControl ? 'bg-[#FF0000] hover:bg-[#CC0000] cursor-pointer' : 'bg-neutral-800 cursor-not-allowed opacity-60'} text-white flex items-center justify-center transition-all shadow-md shadow-[#FF0000]/30 hover:scale-105 active:scale-95`}
              title={canControl ? (isPlaying ? 'Pause' : 'Play') : 'Playback locked to Host/Moderator'}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <button
              onClick={() => handleSkipSeconds(-10)}
              className="p-1.5 hover:text-white text-slate-300 transition-colors cursor-pointer"
              title="Rewind 10s"
            >
              <span className="material-symbols-outlined text-[22px]">replay_10</span>
            </button>

            <button
              onClick={() => handleSkipSeconds(10)}
              className="p-1.5 hover:text-white text-slate-300 transition-colors cursor-pointer"
              title="Forward 10s"
            >
              <span className="material-symbols-outlined text-[22px]">forward_10</span>
            </button>

            <div className="flex items-center gap-2 group/volume">
              <button onClick={handleVolumeToggle} className="p-1.5 hover:text-white text-slate-300 transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">
                  {isMuted || volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
                </span>
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 accent-[#FF0000] bg-white/20 rounded-full cursor-pointer"
              />
            </div>

            <div className="font-mono text-sm text-[#AAAAAA] pl-2 flex items-center gap-1.5 select-none">
              <span className="text-white font-bold">{formatTime(localCurrentTime)}</span>
              <span className="text-[#717171]">/</span>
              <span className="font-medium">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SPEED SELECTOR MENU & BUTTON */}
            <div ref={speedMenuRef} className="relative">
              <button
                onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-[#FF0000]/30 border border-white/15 text-xs font-mono font-bold text-white tracking-wide transition-all cursor-pointer shadow-sm hover:scale-105"
                title="Change Video Speed (0.25x - 2.0x)"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-400">speed</span>
                <span>{playbackSpeed === 1 ? '1.0x' : `${playbackSpeed}x`}</span>
                <span className="material-symbols-outlined text-[14px] text-[#AAAAAA]">expand_less</span>
              </button>

              {/* Speed Selection Popup Menu */}
              {isSpeedMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-44 bg-[#161616]/95 border border-white/20 rounded-xl shadow-2xl p-1.5 z-50 text-xs flex flex-col gap-1 backdrop-blur-2xl">
                  <div className="px-2.5 py-1 text-[10px] font-mono text-[#AAAAAA] uppercase font-bold border-b border-white/10 flex items-center justify-between">
                    <span>Playback Speed</span>
                    <span className="text-amber-400">Speed</span>
                  </div>
                  <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto pt-1">
                    {speedOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleSpeedChange(opt.value)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium transition-all cursor-pointer ${playbackSpeed === opt.value
                            ? 'bg-[#FF0000] text-white font-bold shadow-md shadow-[#FF0000]/30'
                            : 'text-slate-200 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        <span>{opt.label}</span>
                        {playbackSpeed === opt.value && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AUTOMATIC ADAPTIVE QUALITY BADGE */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 border border-white/15 text-xs font-mono font-bold text-white tracking-wide select-none"
              title="Video quality automatically adjusts based on each device's internet connection speed"
            >
              <span className="material-symbols-outlined text-[15px] text-[#FF4D4D]">hd</span>
              <span>Auto HD</span>
            </div>

            <button onClick={handleToggleFullscreen} className="p-1.5 hover:text-white transition-colors text-slate-[#AAAAAA] hover:text-white cursor-pointer" title="Fullscreen">
              <span className="material-symbols-outlined text-[24px]">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
