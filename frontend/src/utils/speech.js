// frontend/src/utils/speech.js

// This function makes the browser speak a given text
export const speak = (text, onSpeakCallback) => {
  if ('speechSynthesis' in window) {
    // 1. Cancel any currently speaking audio
    window.speechSynthesis.cancel();

    // 2. Trigger Callback for Subtitles
    if (onSpeakCallback && typeof onSpeakCallback === 'function') {
      onSpeakCallback(text);
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // 3. Voice Strategy: Find a natural voice with Greek accent
    const voices = window.speechSynthesis.getVoices();

    // Priority:
    // 1. A Google voice for el-GR (usually very natural)
    // 2. Any other natural-sounding Greek voice
    // 3. Fallback to English
    const naturalGreek = voices.find(v => (v.lang.includes('el') || v.lang.includes('GR')) && v.name.includes('Google'));
    const anyGreek = voices.find(v => v.lang.includes('el') || v.lang.includes('GR'));

    if (naturalGreek || anyGreek) {
      utterance.voice = naturalGreek || anyGreek;
      // CRITICAL: Keep lang as English so it handles the phonetics correctly, 
      // but the Greek voice provides the accent.
      utterance.lang = 'en-US';
    } else {
      utterance.lang = 'en-US';
    }

    // 4. Rate/Pitch for a more measured, wise "Oracle" tone
    utterance.rate = 0.85; // Slightly slower for gravity
    utterance.pitch = 0.95; // Slightly lower for a deeper, more resonant voice

    window.speechSynthesis.speak(utterance);
  } else {
    console.error("Speech synthesis is not supported in this browser.");
  }
};

// This function processes the user's command
export const processCommand = (command, insightData, onSpeakCallback) => {
  if (!command) return;
  const lower = command.toLowerCase();

  // Helper to wrap speak with callback
  const reply = (text) => speak(text, onSpeakCallback);

  // --- GREETING ---
  if (lower.includes('hello') || lower.includes('hi')) {
    reply("Greetings. I am listening.");
    return;
  }

  // --- ACTIVE HABITS ---
  if (lower.includes('habit')) {
    if (insightData && insightData.missedHabits && insightData.missedHabits.length > 0) {
      const habitList = insightData.missedHabits.join(', ');
      reply(`You have ${insightData.missedHabits.length} habits pending for today: ${habitList}.`);
    } else {
      reply("All your active habits have been logged today. Excellent discipline.");
    }
    return;
  }

  // --- REPORTS / PRODUCTIVITY ---
  if (lower.includes('report') || lower.includes('status') || lower.includes('doing')) {
    if (insightData && insightData.productivitySummary) {
      reply(insightData.productivitySummary);
    } else {
      reply("I cannot generate a report at this moment.");
    }
    return;
  }

  // --- TASKS AVAILABLE ---
  if (lower.includes('task') && (lower.includes('available') || lower.includes('any') || lower.includes('what'))) {
    if (insightData && insightData.tasks && insightData.tasks.length > 0) {
      const topTask = insightData.tasks[0];
      reply(`You have ${insightData.tasks.length} high priority tasks available. The most critical one is: ${topTask.text}.`);
    } else {
      reply("You have no urgent tasks available. Your path is clear.");
    }
    return;
  }

  // --- READ INSIGHT (Default) ---
  if (lower.includes('read') || lower.includes('insight')) {
    if (insightData && insightData.message) {
      reply(insightData.message);
    }
    return;
  }

  // Default fallback
  reply("I did not understand that command. Ask me about your tasks, habits, or reports.");
};