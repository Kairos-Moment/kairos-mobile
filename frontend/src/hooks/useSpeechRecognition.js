// frontend/src/hooks/useSpeechRecognition.js
import { useState, useEffect } from 'react';

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false; // Stop listening after a pause
  recognition.lang = 'en-US';
  recognition.interimResults = false; // Only get the final result
}

// --- THE FIX IS HERE ---
// Ensure the "export" keyword is present before "const"
export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  const startListening = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) return;

    recognition.start();
  };

  const stopListening = () => {
    if (!recognition || !isListening) return;
    recognition.stop();
  };

  useEffect(() => {
    if (!recognition) return;

    const handleStart = () => {
      setIsListening(true);
      setTranscript('');
      setError(null);
    };

    const handleEnd = () => {
      setIsListening(false);
    };

    const handleError = (event) => {
      setError(event.error);
      setIsListening(false);
    };

    const handleResult = (event) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
    };

    // Assign event handlers
    recognition.addEventListener('start', handleStart);
    recognition.addEventListener('end', handleEnd);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('result', handleResult);

    // Cleanup listeners on component unmount
    return () => {
      recognition.removeEventListener('start', handleStart);
      recognition.removeEventListener('end', handleEnd);
      recognition.removeEventListener('error', handleError);
      recognition.removeEventListener('result', handleResult);
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    hasSupport: !!recognition,
  };
};