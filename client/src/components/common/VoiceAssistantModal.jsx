import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { AssistantService } from '../../services/assistantService';
import { API_BASE_URL } from '../../config/api';
import { 
  Mic, MicOff, Volume2, Send, Sparkles, X, 
  ArrowRight, AlertCircle, RefreshCw, Square, User, Bot,
  Activity, Wrench, Radio, MessageSquare
} from 'lucide-react';

const SIH_DEMO_QUESTIONS = [
  'आज गेहूं का भाव क्या है?',
  'आज प्याज का भाव क्या है?',
  'मेरी फसल कहाँ बेचनी चाहिए?',
  'अगले 15 दिन में गेहूं का भाव बढ़ेगा?',
  'मेरे कितने प्रस्ताव आए हैं?',
  'मेरे ऑर्डर की स्थिति क्या है?',
  '100 क्विंटल गेहूं 2480 रुपये में बेचने पर कितना मिलेगा?',
  'नमस्ते'
];

const HINDI_ONES = [
  '', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
  'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
  'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पचीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
  'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
  'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
  'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
  'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
  'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्नासी', 'अस्सी',
  'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
  'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'
];

function numberToHindiWords(num) {
  num = Math.round(Number(num));
  if (isNaN(num) || num === 0) return 'शून्य';
  if (num < 0) return 'माइनस ' + numberToHindiWords(-num);

  let result = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  if (crore > 0) result += (HINDI_ONES[crore] || crore) + ' करोड़ ';

  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh > 0) result += (HINDI_ONES[lakh] || lakh) + ' लाख ';

  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand > 0) result += (HINDI_ONES[thousand] || thousand) + ' हजार ';

  const hundred = Math.floor(num / 100);
  num %= 100;
  if (hundred > 0) result += (HINDI_ONES[hundred] || hundred) + ' सौ ';

  if (num > 0) result += (HINDI_ONES[num] || num) + ' ';

  return result.trim();
}

function cleanSpokenHindiText(text) {
  if (!text) return '';
  let str = text;

  // Convert ₹ amounts e.g. ₹2,48,000 or ₹2450 to Hindi words + रुपये
  str = str.replace(/₹\s*([0-9,]+)/g, (match, p1) => {
    const rawNum = parseInt(p1.replace(/,/g, ''), 10);
    if (!isNaN(rawNum) && rawNum > 0) {
      return numberToHindiWords(rawNum) + ' रुपये';
    }
    return 'रुपये';
  });

  // Convert standalone numeric rupee amounts e.g. 2480 रुपये
  str = str.replace(/\b(\d{2,7})\s*(?:रुपये|रुपए|रु)/g, (match, p1) => {
    const rawNum = parseInt(p1, 10);
    if (!isNaN(rawNum) && rawNum > 0) {
      return numberToHindiWords(rawNum) + ' रुपये';
    }
    return match;
  });

  // Clean abbreviations and special symbols for smooth natural TTS
  str = str.replace(/\/क्विंटल/g, ' प्रति क्विंटल');
  str = str.replace(/\//g, ' प्रति ');
  str = str.replace(/%/g, ' प्रतिशत');
  str = str.replace(/\+/g, ' प्लस ');
  str = str.replace(/[*#•_~`💡🌾📊🎯🤝💼📦🙏📈]/g, ' ');
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

export default function VoiceAssistantModal({ isOpen, onClose, initialQuery = '' }) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'RECORDING' | 'PROCESSING' | 'SPEAKING' | 'ERROR'
  const [errorMessage, setErrorMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeContext, setActiveContext] = useState({});
  const [waveformData, setWaveformData] = useState([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [hasSpokenOnce, setHasSpokenOnce] = useState(false);

  const recognitionRef = useRef(null);
  const recognitionActiveRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStartTimeRef = useRef(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const currentAudioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const voicesListRef = useRef([]);
  const finalTranscriptReceivedRef = useRef(false);
  const speechWatchdogRef = useRef(null);

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[VOICE ${timestamp}] ${msg}`);
    setDiagnosticLogs(prev => [...prev.slice(-25), `${timestamp}: ${msg}`]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status, interimTranscript]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices() || [];
        voicesListRef.current = voices;
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      stopPlayback();
      stopRecording();
    };
  }, []);

  // Modal open / initial query handler
  useEffect(() => {
    if (isOpen) {
      addLog('VOICE: Assistant Modal Opened');
      if (initialQuery) {
        processUserQuery(initialQuery);
      } else if (messages.length === 0) {
        setMessages([
          {
            id: 'welcome-msg',
            sender: 'assistant',
            text: '🙏 नमस्ते! मैं KrishiLink AI सहायक हूँ। आप माइक दबाकर सीधे बोलें या नीचे लिखकर पूछें।',
            speech_text: 'नमस्ते! मैं KrishiLink AI सहायक हूँ। आप मुझसे मंडी भाव, फसल बेचने के विकल्प, खरीदार या ऑर्डर के बारे में पूछ सकते हैं।',
            timestamp: new Date()
          }
        ]);
      }
    } else {
      stopPlayback();
      stopRecording();
      setStatus('IDLE');
      setWaveformData([]);
      setInterimTranscript('');
    }
  }, [isOpen]);

  // Pick best Hindi / Indian TTS voice with prioritised hierarchy
  const getBestHindiVoice = () => {
    const voices = voicesListRef.current.length > 0 
      ? voicesListRef.current 
      : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);

    if (!voices || voices.length === 0) return null;

    // 1. Precise hi-IN / hi_IN voice (Google हिन्दी, Microsoft Madhur, Swara)
    const exactHindiVoice = voices.find(v => 
      v.lang === 'hi-IN' || 
      v.lang === 'hi_IN' ||
      v.name.toLowerCase().includes('hindi') || 
      v.name.toLowerCase().includes('हिन्दी') ||
      v.name.toLowerCase().includes('swara') ||
      v.name.toLowerCase().includes('madhur')
    );
    if (exactHindiVoice) return exactHindiVoice;

    // 2. Any Hindi language voice
    const anyHindi = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
    if (anyHindi) return anyHindi;

    // 3. Indian English fallback voice (Neerja, Prabhat, etc.)
    const indianEnglish = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
    if (indianEnglish) return indianEnglish;

    // 4. Default available voice
    return voices[0] || null;
  };

  // Speak Hindi text via browser SpeechSynthesis
  const speakHindi = (rawText) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !rawText) {
      setStatus('IDLE');
      return;
    }

    try {
      // 1. Cancel any ongoing playback
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (speechWatchdogRef.current) {
        clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }

      // 2. Normalize numbers & currency into natural Hindi words
      const textToSpeak = cleanSpokenHindiText(rawText);
      addLog(`VOICE: starting Hindi TTS: "${textToSpeak.substring(0, 45)}..."`);

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const selectedVoice = getBestHindiVoice();

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || 'hi-IN';
        addLog(`VOICE: Hindi voice = ${selectedVoice.name} (${selectedVoice.lang})`);
      } else {
        utterance.lang = 'hi-IN';
        addLog('VOICE: using default hi-IN voice');
      }

      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        addLog('VOICE: TTS starting');
        setStatus('SPEAKING');
        setHasSpokenOnce(true);
      };

      utterance.onend = () => {
        addLog('VOICE: TTS completed');
        setStatus('IDLE');
        activeUtteranceRef.current = null;
        if (speechWatchdogRef.current) {
          clearTimeout(speechWatchdogRef.current);
          speechWatchdogRef.current = null;
        }
      };

      utterance.onerror = (e) => {
        addLog(`VOICE: TTS completed (${e.error || 'done'})`);
        setStatus('IDLE');
        activeUtteranceRef.current = null;
        if (speechWatchdogRef.current) {
          clearTimeout(speechWatchdogRef.current);
          speechWatchdogRef.current = null;
        }
      };

      activeUtteranceRef.current = utterance;
      if (typeof window !== 'undefined') {
        window._krishiActiveUtterance = utterance;
      }

      // Safety watchdog: ensure UI never stays stuck in SPEAKING
      const expectedDuration = Math.max(4000, Math.min(30000, textToSpeak.length * 110));
      speechWatchdogRef.current = setTimeout(() => {
        if (activeUtteranceRef.current) {
          addLog('VOICE: TTS auto-complete watchdog triggered');
          setStatus('IDLE');
          activeUtteranceRef.current = null;
        }
      }, expectedDuration);

      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.error('speechSynthesis.speak error:', err);
          setStatus('IDLE');
        }
      }, 50);

    } catch (e) {
      console.error('SpeechSynthesis exception:', e);
      setStatus('IDLE');
    }
  };

  // Play audio response (Gemini TTS audio or seamless SpeechSynthesis fallback)
  const playAudioResponse = (audioBase64, mimeType = 'audio/wav', fallbackSpeechText = '') => {
    if (audioBase64) {
      try {
        stopPlayback();
        const byteCharacters = atob(audioBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType || 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        currentAudioRef.current = audio;

        audio.onplay = () => {
          addLog('VOICE: audio playback started');
          setStatus('SPEAKING');
          setHasSpokenOnce(true);
        };

        audio.onended = () => {
          addLog('VOICE: audio playback ended');
          setStatus('IDLE');
          currentAudioRef.current = null;
        };

        audio.onerror = () => {
          // Gracefully fallback to speech synthesis without user error
          addLog('VOICE: continuing with Hindi speech synthesis');
          speakHindi(fallbackSpeechText);
        };

        audio.play().catch(err => {
          // Gracefully fallback to speech synthesis without user error
          addLog(`VOICE: audio.play() blocked, continuing with Hindi TTS`);
          speakHindi(fallbackSpeechText);
        });
        return;
      } catch (err) {
        console.warn('Audio decode fallback:', err);
      }
    }

    // High-quality natural browser SpeechSynthesis
    speakHindi(fallbackSpeechText);
  };

  const stopPlayback = () => {
    if (speechWatchdogRef.current) {
      clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    activeUtteranceRef.current = null;
    if (status === 'SPEAKING') {
      setStatus('IDLE');
    }
    addLog('VOICE: audio playback stopped');
  };

  // Start Speech Recognition & Microphone Stream
  const startRecording = async () => {
    stopPlayback();
    setErrorMessage(null);
    setInterimTranscript('');
    recordedChunksRef.current = [];
    finalTranscriptReceivedRef.current = false;

    try {
      addLog('VOICE: recording started');
      addLog('VOICE: microphone requested');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioStreamRef.current = stream;
      addLog('VOICE: microphone permission granted');

      // Setup Web Audio Analyser for live frequency waveform
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkWaveform = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          setWaveformData(Array.from(dataArray).slice(0, 16));
          animFrameRef.current = requestAnimationFrame(checkWaveform);
        };
        checkWaveform();
      }

      // Initialize browser SpeechRecognition for live interim transcripts
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionActiveRef.current) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'hi-IN';
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;

          recognition.onstart = () => {
            recognitionActiveRef.current = true;
            addLog('VOICE: Web Speech recognition started (hi-IN)');
          };

          recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }

            if (interim) {
              setInterimTranscript(interim);
            }

            if (final && final.trim().length > 0) {
              addLog(`VOICE: final speech recognized: "${final.trim()}"`);
              finalTranscriptReceivedRef.current = true;
              setInterimTranscript('');
              stopRecording();
              processUserQuery(final.trim());
            }
          };

          recognition.onerror = (e) => {
            addLog(`VOICE: recognition note: ${e.error || 'silence'}`);
            // Do not crash; MediaRecorder backup will process audio
          };

          recognition.onend = () => {
            recognitionActiveRef.current = false;
            addLog('VOICE: recognition ended');
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (recErr) {
          console.warn('SpeechRecognition init warning:', recErr);
        }
      }

      // Start MediaRecorder backup in parallel
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      }

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        addLog('VOICE: recording stopped');
        cleanupAudioStream();

        // If Web Speech API already submitted the query, skip duplicate upload
        if (finalTranscriptReceivedRef.current) {
          return;
        }

        const chunks = recordedChunksRef.current;
        const actualMime = recorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: actualMime });

        addLog(`VOICE: blob size = ${audioBlob.size} bytes`);

        if (audioBlob.size < 500) {
          addLog('VOICE: audio too small');
          setErrorMessage('आवाज़ बहुत छोटी या स्पष्ट नहीं थी। कृपया थोड़ा पास से और साफ़ बोलें।');
          setStatus('IDLE');
          return;
        }

        // Process audio via backend
        await processUserQuery(null, audioBlob);
      };

      recordingStartTimeRef.current = Date.now();
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setStatus('RECORDING');

    } catch (err) {
      console.error('Microphone recording error:', err);
      addLog(`VOICE: error = ${err.message}`);
      cleanupAudioStream();
      setStatus('ERROR');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('माइक्रोफोन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग में अनुमति दें।');
      } else {
        setErrorMessage('माइक्रोफोन शुरू करने में समस्या हुई। कृपया नीचे लिखकर पूछें।');
      }
    }
  };

  // Stop Microphone Recording
  const stopRecording = () => {
    if (recognitionRef.current && recognitionActiveRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionActiveRef.current = false;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      const durationMs = Date.now() - recordingStartTimeRef.current;
      if (durationMs < 800) {
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setStatus('PROCESSING');
          }
        }, 800 - durationMs);
      } else {
        mediaRecorderRef.current.stop();
        setStatus('PROCESSING');
      }
    } else {
      cleanupAudioStream();
    }
  };

  const cleanupAudioStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setWaveformData([]);
  };

  // UNIFIED QUERY PROCESSING PIPELINE (for Voice, Suggested Chips, or Text)
  const processUserQuery = async (queryText = null, audioBlob = null) => {
    stopPlayback();
    stopRecording();
    setErrorMessage(null);
    setInterimTranscript('');
    setStatus('PROCESSING');

    // 30-Second Timeout Safety Guard
    const timeoutId = setTimeout(() => {
      if (status === 'PROCESSING') {
        addLog('VOICE: error = Request timed out after 30s');
        setStatus('IDLE');
        setErrorMessage('वॉइस सेवा में समय अधिक लग रहा है। कृपया दोबारा प्रयास करें।');
      }
    }, 30000);

    try {
      let data = null;

      if (audioBlob) {
        addLog(`VOICE: uploading audio to /api/v1/voice/ask`);
        data = await AssistantService.uploadAudio(audioBlob, activeContext);
      } else {
        const text = (queryText || inputText).trim();
        if (!text) {
          clearTimeout(timeoutId);
          setStatus('IDLE');
          return;
        }
        setInputText('');
        addLog(`VOICE: sending query: "${text}"`);
        data = await AssistantService.query(text, activeContext);
      }

      clearTimeout(timeoutId);

      const transcript = data.transcript || queryText || 'सवाल';
      const answer = data.response_text || data.answer || 'उत्तर उपलब्ध नहीं है।';
      const spokenText = data.speech_text || data.answer || answer;

      addLog(`VOICE: transcript = "${transcript}"`);
      addLog(`VOICE: answer = "${answer.substring(0, 50)}..."`);

      // Update conversational context
      if (data.intent) {
        setActiveContext(prev => ({
          ...prev,
          last_intent: data.intent,
          commodity: data.entities?.commodity || prev.commodity
        }));
      }

      // Add messages to conversation
      const userMsgId = `user-${Date.now()}`;
      const asstMsgId = `asst-${Date.now()}`;

      setMessages(prev => [
        ...prev,
        {
          id: userMsgId,
          sender: 'user',
          text: transcript,
          timestamp: new Date()
        },
        {
          id: asstMsgId,
          sender: 'assistant',
          text: answer,
          speech_text: spokenText,
          card_data: data.card_data || null,
          timestamp: new Date()
        }
      ]);

      // Play Hindi spoken response
      playAudioResponse(data.audio, data.mimeType || 'audio/wav', spokenText);

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Process query error:', err);
      addLog(`VOICE: error = ${err.response?.data?.message || err.message}`);
      setStatus('ERROR');
      setErrorMessage(err.response?.data?.message || err.message || 'उत्तर प्राप्त करने में समस्या हुई। कृपया दोबारा प्रयास करें।');
    } finally {
      if (status === 'PROCESSING') {
        setStatus('IDLE');
      }
    }
  };

  const handleActionClick = (url) => {
    if (!url) return;
    stopPlayback();
    stopRecording();
    onClose();
    navigate(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-darkbg-surface w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-darkbg-border overflow-hidden flex flex-col h-[94vh] sm:h-[86vh] transition-colors">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-krishi-800 via-krishi-900 to-krishi-950 dark:from-darkbg-card dark:to-darkbg-surface text-white p-4 sm:p-5 flex items-center justify-between border-b border-krishi-700/50 dark:border-darkbg-border shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-kisan-gold/20 border border-kisan-gold/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-kisan-gold animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 font-sans">
                <span>कृषि-लिंक AI सहायक</span>
                <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-black tracking-wide flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  VOICE AI
                </span>
              </h3>
              <p className="text-xs text-krishi-200 dark:text-darkbg-muted">
                बोलकर या लिखकर खेती, मंडी भाव व बिक्री की जानकारी पाएं
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`p-2 rounded-xl text-xs font-bold transition touch-btn ${
                showDiagnostics ? 'bg-kisan-gold text-gray-950' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="डायग्नोस्टिक टूल्स (Developer Mode)"
            >
              <Wrench className="w-4 h-4" />
            </button>

            <button
              onClick={() => { stopPlayback(); stopRecording(); onClose(); }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition touch-btn"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diagnostic Panel (Collapsible) */}
        {showDiagnostics && (
          <div className="bg-gray-900 text-gray-100 p-3 text-xs border-b border-gray-800 space-y-2 animate-in slide-in-from-top shrink-0 max-h-48 overflow-y-auto font-mono">
            <div className="flex items-center justify-between font-sans">
              <span className="font-bold text-kisan-gold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Voice Pipeline Diagnostic</span>
              </span>
              <span className="text-[11px] bg-gray-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                Status: {status}
              </span>
            </div>

            <div className="text-[10px] text-gray-400 space-y-0.5 bg-black/40 p-2 rounded max-h-24 overflow-y-auto">
              {diagnosticLogs.slice(-6).map((log, i) => (
                <div key={i} className="truncate">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Live Speaking / Listening Status Strip */}
        {status === 'SPEAKING' && (
          <div className="bg-amber-500/15 dark:bg-amber-500/20 border-b border-amber-300 dark:border-amber-700/50 px-4 py-2.5 flex items-center justify-between animate-in fade-in shrink-0">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                🔊 जवाब दे रहा हूँ... (Speaking)
              </span>
            </div>
            <button
              type="button"
              onClick={stopPlayback}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-gray-950 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition touch-btn"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>जवाब रोकें (Stop)</span>
            </button>
          </div>
        )}

        {status === 'RECORDING' && (
          <div className="bg-red-500/15 dark:bg-red-500/20 border-b border-red-300 dark:border-red-700/50 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
              </span>
              <div>
                <span className="text-xs font-black text-red-950 dark:text-red-200 block">
                  🎤 सुन रहा हूँ... बोलिए (Listening...)
                </span>
                {interimTranscript ? (
                  <span className="text-xs text-red-800 dark:text-red-300 font-bold italic">
                    "{interimTranscript}"
                  </span>
                ) : (
                  <span className="text-[10px] text-red-700 dark:text-red-400">
                    बोलना समाप्त होने पर "पूर्ण करें" दबाएँ
                  </span>
                )}
              </div>
            </div>

            {/* Live Audio Frequency Waveform */}
            {waveformData.length > 0 && (
              <div className="flex items-center space-x-1">
                {waveformData.map((val, idx) => (
                  <div
                    key={idx}
                    className="w-1 bg-red-500 dark:bg-red-400 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(4, Math.min(24, Math.round(val / 8)))}px` }}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition touch-btn"
            >
              <span>पूर्ण करें (Done)</span>
            </button>
          </div>
        )}

        {status === 'PROCESSING' && (
          <div className="bg-blue-500/15 dark:bg-blue-500/20 border-b border-blue-300 dark:border-blue-700/50 px-4 py-2 flex items-center space-x-2 shrink-0 animate-in fade-in">
            <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="text-xs font-black text-blue-950 dark:text-blue-200">
              🧠 समझ रहा हूँ... (Processing Voice Query & Mandi Data)
            </span>
          </div>
        )}

        {/* Conversation Message List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
            >
              <div className="flex items-start gap-2 max-w-[88%] sm:max-w-[85%]">
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-krishi-700 text-kisan-gold flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-krishi-700 text-white rounded-tr-none'
                    : msg.isError 
                      ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 rounded-tl-none'
                      : 'bg-emerald-50/80 dark:bg-darkbg-card border border-emerald-200/80 dark:border-darkbg-border text-gray-900 dark:text-gray-100 rounded-tl-none whitespace-pre-line'
                }`}>
                  {msg.text}

                  {/* Audio replay button for assistant */}
                  {msg.sender === 'assistant' && (msg.speech_text || msg.text) && (
                    <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-darkbg-border flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => speakHindi(msg.speech_text || msg.text)}
                        className="flex items-center space-x-1.5 text-xs font-black text-krishi-700 dark:text-kisan-gold hover:underline touch-btn"
                        title="उत्तर दोबारा सुनें"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>🔊 दोबारा सुनें</span>
                      </button>
                    </div>
                  )}

                  {/* Action card if available */}
                  {msg.card_data && (
                    <div className="mt-3 p-3 bg-white dark:bg-darkbg-surface border-2 border-krishi-500 dark:border-krishi-600 rounded-xl shadow-xs flex items-center justify-between gap-2.5">
                      <div>
                        <span className="text-[10px] font-black text-krishi-700 dark:text-krishi-300 uppercase tracking-wider block">
                          {msg.card_data.title}
                        </span>
                        <span className="text-sm sm:text-base font-black text-gray-950 dark:text-white">
                          {msg.card_data.value}
                        </span>
                        {msg.card_data.subtitle && (
                          <p className="text-[11px] text-gray-500 dark:text-darkbg-muted">
                            {msg.card_data.subtitle}
                          </p>
                        )}
                      </div>

                      {msg.card_data.action_url && (
                        <button
                          type="button"
                          onClick={() => handleActionClick(msg.card_data.action_url)}
                          className="bg-krishi-600 hover:bg-krishi-700 text-white font-black px-3.5 py-2 rounded-xl text-xs shadow-xs flex items-center space-x-1 touch-btn shrink-0"
                        >
                          <span>{msg.card_data.action_label || 'विवरण'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-kisan-gold text-gray-950 flex items-center justify-center shrink-0 shadow-xs mt-0.5 font-black text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Error Alert */}
          {errorMessage && status === 'ERROR' && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-4 rounded-2xl text-xs text-red-900 dark:text-red-200 flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black block">सूचना:</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Suggested SIH Demo Questions (Uses the exact same unified query pipeline) */}
          <div className="pt-2">
            <span className="text-[11px] font-black text-gray-500 dark:text-darkbg-muted block mb-2">
              💡 उदाहरण सवाल (Examples):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SIH_DEMO_QUESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => processUserQuery(sug)}
                  className="bg-gray-100 dark:bg-darkbg-card hover:bg-krishi-100 dark:hover:bg-darkbg-hover hover:text-krishi-900 dark:hover:text-white border border-gray-200 dark:border-darkbg-border text-gray-800 dark:text-gray-200 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition text-left touch-btn active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-kisan-gold" />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Central Voice Action & Input Controls */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-darkbg-surface border-t border-gray-200 dark:border-darkbg-border flex flex-col space-y-3 shrink-0">
          
          {/* Main Large Voice Button Area */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={status === 'RECORDING' ? stopRecording : startRecording}
              className={`px-6 py-3.5 rounded-2xl flex items-center justify-center space-x-2 font-black shadow-lg transition-all touch-btn active:scale-95 ${
                status === 'RECORDING' 
                  ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-300 dark:ring-red-900' 
                  : status === 'SPEAKING'
                    ? 'bg-amber-500 text-gray-950 hover:bg-amber-400'
                    : 'bg-gradient-to-r from-kisan-gold via-amber-400 to-amber-500 text-gray-950 hover:brightness-105'
              }`}
              title={status === 'RECORDING' ? "रुकें (Stop)" : "बोलने के लिए दबाएँ"}
            >
              {status === 'RECORDING' ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span className="text-xs sm:text-sm">रुकें (बोलना पूरा होने पर दबाएँ)</span>
                </>
              ) : status === 'SPEAKING' ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span className="text-xs sm:text-sm">जवाब रोकें</span>
                </>
              ) : hasSpokenOnce ? (
                <>
                  <Mic className="w-5 h-5" />
                  <span className="text-xs sm:text-sm">🎤 फिर से पूछें (Tap to Speak)</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span className="text-xs sm:text-sm">🎙️ बोलें (Tap to Speak - Natural Hindi)</span>
                </>
              )}
            </button>
          </div>

          {/* Typing fallback input */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && processUserQuery()}
              placeholder="या हिंदी में कोई भी सवाल टाइप करें..."
              className="flex-1 px-4 py-2.5 bg-white dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-xs sm:text-sm font-bold text-gray-950 dark:text-white focus:border-krishi-600 outline-none shadow-xs"
            />

            <button
              type="button"
              disabled={!inputText.trim() || status === 'PROCESSING'}
              onClick={() => processUserQuery()}
              className="px-4 py-2.5 bg-krishi-600 hover:bg-krishi-700 text-white rounded-xl flex items-center justify-center font-bold shadow-md touch-btn disabled:opacity-50 active:scale-95 shrink-0"
              title="भेजें"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
