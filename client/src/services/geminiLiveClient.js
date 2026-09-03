/**
 * GeminiLiveClient - Handles Web Audio 16kHz PCM capture and 24kHz PCM playback over WebSocket
 */
export class GeminiLiveClient {
  constructor({ onStatusChange, onText, onCard, onAudioState, onError, onWaveformData }) {
    this.onStatusChange = onStatusChange || (() => {});
    this.onText = onText || (() => {});
    this.onCard = onCard || (() => {});
    this.onAudioState = onAudioState || (() => {});
    this.onError = onError || (() => {});
    this.onWaveformData = onWaveformData || (() => {});

    this.ws = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.analyser = null;
    this.playbackContext = null;
    this.nextPlaybackTime = 0;
    this.isPlayingAudio = false;
    this.animFrame = null;
    this.activeSources = [];
  }

  /**
   * Connect WebSocket and initialize audio hardware
   */
  async connect(token = '') {
    this.onStatusChange('CONNECTING');

    let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.hostname === 'localhost' ? 'localhost:3001' : window.location.host;

    if (import.meta.env.VITE_WS_URL) {
      // Direct override if specified
    } else if (import.meta.env.VITE_API_BASE_URL) {
      try {
        const apiUrl = new URL(import.meta.env.VITE_API_BASE_URL);
        protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        host = apiUrl.host;
      } catch (e) {
        // Fall back to window.location host
      }
    }

    const url = import.meta.env.VITE_WS_URL
      ? `${import.meta.env.VITE_WS_URL}/api/v1/voice/live${token ? `?token=${encodeURIComponent(token)}` : ''}`
      : `${protocol}//${host}/api/v1/voice/live${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[GEMINI LIVE CLIENT] WebSocket connected');
        this.onStatusChange('IDLE');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            console.log('[GEMINI LIVE CLIENT] Gemini Live Ready:', msg.model);
          } else if (msg.type === 'text') {
            this.onText(msg.text, false);
          } else if (msg.type === 'audio' && msg.pcm) {
            this.playPcmChunk(msg.pcm, 24000);
          } else if (msg.type === 'card' && msg.card) {
            this.onCard(msg.card);
          } else if (msg.type === 'response') {
            // Local fallback response
            this.onText(msg.text, true);
            if (msg.card) this.onCard(msg.card);
          } else if (msg.type === 'turn_complete') {
            // Waiting for audio playback to finish
          } else if (msg.type === 'error') {
            this.onError(msg.message);
          }
        } catch (e) {
          console.error('[GEMINI LIVE CLIENT] Parse error:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[GEMINI LIVE CLIENT] WebSocket error:', err);
        this.onError('वॉइस सर्वर से कनेक्शन में समस्या हुई।');
      };

      this.ws.onclose = () => {
        console.log('[GEMINI LIVE CLIENT] WebSocket closed');
        this.onStatusChange('IDLE');
      };

    } catch (err) {
      console.error('[GEMINI LIVE CLIENT] Connection failure:', err);
      this.onError('सर्वर से कनेक्ट नहीं हो सका।');
    }
  }

  /**
   * Start microphone audio stream and send 16kHz PCM chunks to Gemini
   */
  async startMicrophone() {
    this.stopPlayback();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Analyser for Live Waveform Visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        this.onWaveformData(Array.from(dataArray));
        this.animFrame = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

      // ScriptProcessor to capture raw 16kHz Float32 PCM
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.processor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.floatTo16BitPCM(inputData);
        const base64Audio = this.arrayBufferToBase64(pcm16.buffer);

        this.ws.send(JSON.stringify({
          type: 'audio',
          pcm: base64Audio
        }));
      };

      this.onStatusChange('LISTENING');

    } catch (err) {
      console.error('[GEMINI LIVE CLIENT] Microphone start error:', err);
      this.onError('माइक्रोफोन शुरू करने में समस्या हुई।');
    }
  }

  /**
   * Stop microphone audio capture
   */
  stopMicrophone() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    if (this.processor) {
      try { this.processor.disconnect(); } catch (e) {}
      this.processor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }
    this.analyser = null;
  }

  /**
   * Send text message over WebSocket
   */
  sendText(text, context = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.onStatusChange('PROCESSING');
      this.ws.send(JSON.stringify({
        type: 'text',
        text,
        context
      }));
    }
  }

  /**
   * Play incoming 24kHz PCM Audio Chunk from Gemini Live
   */
  playPcmChunk(base64Pcm, sampleRate = 24000) {
    try {
      if (!this.playbackContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.playbackContext = new AudioCtx({ sampleRate });
        this.nextPlaybackTime = this.playbackContext.currentTime;
      }

      if (this.playbackContext.state === 'suspended') {
        this.playbackContext.resume();
      }

      const pcm16 = this.base64ToInt16(base64Pcm);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }

      const audioBuffer = this.playbackContext.createBuffer(1, float32.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);

      const startTime = Math.max(this.nextPlaybackTime, this.playbackContext.currentTime);
      source.start(startTime);
      this.nextPlaybackTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);
      this.onStatusChange('SPEAKING');

      source.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== source);
        if (this.activeSources.length === 0 && this.playbackContext && this.playbackContext.currentTime >= this.nextPlaybackTime - 0.1) {
          this.onStatusChange('IDLE');
        }
      };

    } catch (err) {
      console.error('[GEMINI LIVE CLIENT] Audio playback error:', err);
    }
  }

  /**
   * Interrupt / Stop speaking immediately
   */
  stopPlayback() {
    if (this.activeSources) {
      this.activeSources.forEach(s => {
        try { s.stop(); } catch (e) {}
      });
      this.activeSources = [];
    }
    if (this.playbackContext) {
      this.nextPlaybackTime = this.playbackContext.currentTime;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
  }

  disconnect() {
    this.stopMicrophone();
    this.stopPlayback();
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
  }

  // --- Helper Conversion Utilities ---
  floatTo16BitPCM(input) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  base64ToInt16(base64) {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Int16Array(bytes.buffer);
  }
}
