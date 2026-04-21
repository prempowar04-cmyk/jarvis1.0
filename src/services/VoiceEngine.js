/**
 * VoiceEngine.js
 * ─────────────────────────────────────────────────────────────
 * Handles Speech-to-Text (STT) via Web Speech API.
 */

export class VoiceEngine {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.wakeRecognition = SpeechRecognition ? new SpeechRecognition() : null;
    
    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }

    if (this.wakeRecognition) {
      this.wakeRecognition.continuous = true;
      this.wakeRecognition.interimResults = true;
      this.wakeRecognition.lang = 'en-US';
      this.isWakeWordActive = false;
    }
  }

  startWakeWord(onWakeDetected, onMicLevel) {
    if (!this.wakeRecognition) return;
    this.isWakeWordActive = true;

    this.wakeRecognition.onresult = (event) => {
      let combined = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        combined += event.results[i][0].transcript.toLowerCase();
      }
      
      // Basic activity simulator for visual waves (very rough proxy)
      if (onMicLevel && combined.trim().length > 0) {
         onMicLevel(Math.random() * 0.5 + 0.5); // Provide some activity level
      }

      if (combined.includes('premex') || combined.includes('jarvis') || combined.includes('pre mix') || combined.includes('boss')) {
        this.stopWakeWord(); // Pause background listener
        onWakeDetected();
      }
    };

    this.wakeRecognition.onerror = (event) => {
      // Quietly ignore typical background errors (network, no-speech)
    };

    this.wakeRecognition.onend = () => {
      // Auto-restart to keep background listener alive indefinitely
      if (this.isWakeWordActive) {
        setTimeout(() => {
          try { this.wakeRecognition.start(); } catch (e) {}
        }, 500);
      }
    };

    try {
      this.wakeRecognition.start();
    } catch (e) {}
  }

  stopWakeWord() {
    this.isWakeWordActive = false;
    if (this.wakeRecognition) {
      try { this.wakeRecognition.stop(); } catch (e) {}
    }
  }

  listen(onInterim) {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject("Speech Recognition not supported in this browser.");
        return;
      }

      // Ensure wake word isn't overlapping
      this.stopWakeWord();

      let finalTranscript = '';

      this.recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        if (onInterim) onInterim(interim || finalTranscript);
      };

      this.recognition.onerror = (event) => {
        console.error('[VoiceEngine] Error:', event.error);
        const msg = event.error === 'not-allowed' ? 'MIC PERMISSION DENIED' : event.error.toUpperCase();
        reject(new Error(msg));
      };

      this.recognition.onend = () => {
        resolve(finalTranscript);
      };

      try {
        this.recognition.start();
      } catch (e) {
        reject(e);
      }
    });
  }

  stop() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
  }
}

export const voiceEngine = new VoiceEngine();
