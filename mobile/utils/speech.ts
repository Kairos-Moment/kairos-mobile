import * as Speech from 'expo-speech';

// This function makes the device speak a given text
export const speak = (text: string, onSpeakCallback?: (text: string) => void) => {
    // 1. Cancel any currently speaking audio
    Speech.stop();

    // 2. Trigger Callback for Subtitles
    if (onSpeakCallback && typeof onSpeakCallback === 'function') {
        onSpeakCallback(text);
    }

    // 3. Configure the Oracle's voice
    // Note: Options on mobile are different from web
    const options: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: 0.95,
        rate: 0.85,
    };

    Speech.speak(text, options);
};

// This function processes the user's command
export const processCommand = (command: string, insightData: any, onSpeakCallback?: (text: string) => void) => {
    if (!command) return;
    const lower = command.toLowerCase();

    // Helper to wrap speak with callback
    const reply = (text: string) => speak(text, onSpeakCallback);

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
