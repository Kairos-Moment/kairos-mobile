// frontend/src/pages/FocusSession.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom'; // Ensure this is imported
import apiClient from '../api/axios';
import styles from './FocusSession.module.css';
import {
  IoPlay, IoPause, IoRefresh, IoMusicalNotes,
  IoCheckmarkCircle, IoLogoYoutube, IoSave
} from 'react-icons/io5';
import { getSavedTracks, saveTrack, deleteTrack } from '../api/savedTracksAPI';
import LibraryModal from '../components/focus/LibraryModal';

const GREEK_QUOTES = [
  "We suffer more often in imagination than in reality. — Seneca",
  "The happiness of your life depends upon the quality of your thoughts. — Marcus Aurelius",
  "No man is free who is not master of himself. — Epictetus"
];

const AMBIENT_TRACKS = [
  { name: "Rainfall", url: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg" },
  { name: "Ocean Waves", url: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg" },
  { name: "Crackling Fire", url: "https://actions.google.com/sounds/v1/ambiences/fire.ogg" },
];

const FocusSession = () => {
  const location = useLocation();

  // --- STATE ---
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [customMinutes, setCustomMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [quote] = useState(() => GREEK_QUOTES[Math.floor(Math.random() * GREEK_QUOTES.length)]);
  const [audioUrl, setAudioUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [ytInput, setYtInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Saved Tracks State
  const [savedTracks, setSavedTracks] = useState([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // --- REFS ---
  const audioRef = useRef(new Audio());
  const playerRef = useRef(null);

  // --- 1. SAFE YOUTUBE API LOADING ---
  useEffect(() => {
    // Load script only if it doesn't exist
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Set global callback for YT
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API Ready");
    };
  }, []);

  // --- 2. INITIALIZE PLAYER ---
  useEffect(() => {
    // Check if YT and the Player constructor are available
    if (youtubeId && window.YT && window.YT.Player) {
      try {
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.cueVideoById(youtubeId);
        } else {
          playerRef.current = new window.YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: youtubeId,
            playerVars: { autoplay: 0, loop: 1, playlist: youtubeId },
            events: {
              onReady: (event) => {
                if (isActive) event.target.playVideo();
              },
              onError: (e) => console.error("YT Player Error", e)
            }
          });
        }
      } catch (err) {
        console.error("Failed to initialize YT Player:", err);
      }
    }
  }, [youtubeId]);

  // --- 3. SYNC PLAY/PAUSE ---
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      isActive ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
    }
  }, [isActive]);

  // --- 4. TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // --- 5. DATA FETCHING ---
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await apiClient.get('/tasks');
        const pending = res.data.filter(t => t.status !== 'completed');
        setTasks(pending);

        // Detect Task ID from URL
        const params = new URLSearchParams(location.search);
        const tid = params.get('taskId');
        if (tid) setSelectedTaskId(tid);
      } catch (err) {
        console.error("Task fetch failed", err);
      }
    };
    loadTasks();
    loadTasks();
  }, [location.search]);

  // --- 5.1 FETCH SAVED TRACKS ---
  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const tracks = await getSavedTracks();
      setSavedTracks(tracks);
    } catch (err) {
      console.error("Failed to load saved tracks", err);
    }
  };

  // --- 6. BUILT-IN AUDIO ---
  useEffect(() => {
    if (audioUrl && !youtubeId) {
      audioRef.current.src = audioUrl;
      audioRef.current.loop = true;
      isActive ? audioRef.current.play().catch(() => { }) : audioRef.current.pause();
    } else {
      audioRef.current.pause();
    }
  }, [audioUrl, isActive, youtubeId]);

  // --- HANDLERS ---
  const handleYoutubeSubmit = (e) => {
    e.preventDefault();
    const id = extractYoutubeId(ytInput);
    if (id) {
      setAudioUrl('');
      setYoutubeId(id);
    } else {
      alert("Invalid YouTube Link");
    }
  };

  const extractYoutubeId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const handleSaveCurrentTrack = async () => {
    if (!youtubeId) return alert("No YouTube track loaded to save.");
    const title = prompt("Enter a name for this track:");
    if (title) {
      try {
        await saveTrack(title, youtubeId);
        fetchTracks();
        alert("Track saved to library!");
      } catch (err) {
        console.error(err);
        alert("Failed to save track.");
      }
    }
  };

  const handleDeleteTrack = async (id) => {
    if (window.confirm("Remove from library?")) {
      try {
        await deleteTrack(id);
        setSavedTracks(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const loadSavedTrack = (track) => {
    setYoutubeId(track.youtube_id);
    setAudioUrl('');
    setYtInput(`https://youtu.be/${track.youtube_id}`); // Update input for visibility
  };

  const handleSessionComplete = async () => {
    setIsActive(false);
    if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo();
    if (audioRef.current) audioRef.current.pause();

    if (!selectedTaskId || !sessionStartTime) {
      resetTimer();
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/focus-sessions', {
        task_id: selectedTaskId,
        start_time: sessionStartTime,
        end_time: new Date().toISOString(),
        notes: "Completed via Kairos"
      });
      alert("Kairos Achieved!");
      resetTimer();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(customMinutes * 60);
    setSessionStartTime(null);
    if (playerRef.current?.stopVideo) playerRef.current.stopVideo();
  };

  const toggleTimer = () => {
    if (!selectedTaskId) return alert("Select a labor.");
    if (!isActive && !sessionStartTime) setSessionStartTime(new Date().toISOString());
    setIsActive(!isActive);
  };

  return (
    <div className={`${styles.container} ${isActive ? styles.active : ''}`}>
      <div id="youtube-player" style={{ display: 'none' }}></div>
      <div className={styles.temple}>
        <header className={styles.header}>
          <h1>The Temple of Focus</h1>
          <p className={styles.quote}>“{quote}”</p>
        </header>

        <div className={styles.controlsArea}>
          <div className={styles.configRow}>
            <div className={styles.selectorWrapper}>
              <label>Labor:</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className={styles.dropdown}
              >
                <option value="">-- Choose Task --</option>
                {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div className={styles.selectorWrapper}>
              <label>Minutes:</label>
              <input
                type="number" value={customMinutes}
                onChange={(e) => {
                  const m = parseInt(e.target.value) || 0;
                  setCustomMinutes(m);
                  if (!isActive) setTimeLeft(m * 60);
                }}
                className={styles.timeInput}
              />
            </div>
          </div>

          <div className={styles.timerDisplay}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>

          <div className={styles.actions}>
            <button onClick={toggleTimer} className={styles.primaryBtn}>
              {isActive ? <IoPause /> : <IoPlay />} {isActive ? 'Pause' : 'Begin'}
            </button>
            <button onClick={resetTimer} className={styles.secondaryBtn}><IoRefresh /> Reset</button>
            {isActive && (
              <button onClick={handleSessionComplete} className={styles.finishBtn}>
                <IoCheckmarkCircle /> Finish
              </button>
            )}
          </div>

          <div className={styles.audioSection}>
            <div className={styles.audioTitle}><IoMusicalNotes /> Focus Music</div>
            <form onSubmit={handleYoutubeSubmit} className={styles.ytForm}>
              <IoLogoYoutube className={styles.ytIcon} />
              <input
                type="text" placeholder="YouTube Link" value={ytInput}
                onChange={(e) => setYtInput(e.target.value)} className={styles.ytInput}
              />
              <div style={{ display: 'flex', gap: '5px' }}>
                <button type="submit" className={styles.ytBtn}>Set</button>
                <button type="button" onClick={handleSaveCurrentTrack} className={styles.saveIconBtn} title="Save to Library">
                  <IoSave />
                </button>
              </div>
            </form>
            <div className={styles.audioButtons}>
              <button onClick={() => { setYoutubeId(''); setAudioUrl(''); }} className={!audioUrl && !youtubeId ? styles.activeAudio : ''}>None</button>
              {AMBIENT_TRACKS.map(track => (
                <button
                  key={track.name}
                  onClick={() => { setAudioUrl(track.url); setYoutubeId(''); }}
                  className={audioUrl === track.url ? styles.activeAudio : ''}
                >
                  {track.name}
                </button>
              ))}
            </div>

            {/* Library Open Button */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className={styles.secondaryBtn}
                style={{ width: '100%' }}
              >
                <IoMusicalNotes /> Open Personal Library
              </button>
            </div>

            {/* Library Modal */}
            <LibraryModal
              isOpen={isLibraryOpen}
              onClose={() => setIsLibraryOpen(false)}
              savedTracks={savedTracks}
              onSelectTrack={loadSavedTrack}
              onDeleteTrack={handleDeleteTrack}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusSession;