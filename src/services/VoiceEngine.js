/**
 * VoiceEngine.js
 * ─────────────────────────────────────────────────────────────
 * Handles Speech-to-Text (STT) via Web Speech API.
 */

export class VoiceEngine {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    
    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  listen() {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject("Speech Recognition not supported in this browser.");
        return;
      }

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        console.error('[VoiceEngine] Error:', event.error);
        const msg = event.error === 'not-allowed' ? 'MIC PERMISSION DENIED' : event.error.toUpperCase();
        reject(new Error(msg));
      };

      this.recognition.onend = () => {
        // Recognition ended
      };

      try {
        this.recognition.start();
      } catch (e) {
        reject(e);
      }
    });
  }

  stop() {
    if (this.recognition) this.recognition.stop();
  }
}

export const voiceEngine = new VoiceEngine();
