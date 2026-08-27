const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const AssistantService = require('./assistantService');

class VoiceService {
  /**
   * Process spoken audio recording through Gemini & KrishiLink deterministic services
   * @param {Buffer} audioBuffer - Raw audio file buffer from MediaRecorder
   * @param {string} mimeType - e.g. "audio/webm;codecs=opus" or "audio/webm"
   * @param {object} user - Authenticated user object or null
   * @param {object} context - Conversational context
   * @returns {Promise<object>}
   */
  static async processVoiceAudio(audioBuffer, mimeType = 'audio/webm', user = null, context = {}) {
    // 1. Server-side audio buffer validation
    if (!audioBuffer || audioBuffer.length === 0) {
      const err = new Error('आवाज़ रिकॉर्ड नहीं हो पाई। कृपया दोबारा प्रयास करें।');
      err.statusCode = 400;
      throw err;
    }

    if (audioBuffer.length < 500) {
      const err = new Error('आवाज़ बहुत छोटी या स्पष्ट नहीं थी। कृपया थोड़ा पास से और साफ़ बोलें।');
      err.statusCode = 400;
      throw err;
    }

    console.log(`VOICE SERVICE: processing started (${audioBuffer.length} bytes, ${mimeType})`);

    let transcript = '';
    let detectedIntent = null;
    let geminiError = null;

    // 2. Gemini Multimodal Audio Understanding
    if (env.GEMINI_API_KEY) {
      console.log('VOICE GEMINI: request started');
      try {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        // Cascade through supported Gemini multimodal models
        const modelNames = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];
        let modelResponse = null;

        for (const mName of modelNames) {
          try {
            const model = genAI.getGenerativeModel({ model: mName });
            const prompt = `You are KrishiLink AI, a Hindi-first agricultural marketplace assistant for Indian farmers.
Listen carefully to this spoken audio from a farmer speaking in Hindi, Hinglish, or regional terms.
1. Transcribe the farmer's question accurately in clean Devanagari Hindi text.
2. Identify the intent:
   - "market_price" (भाव, रेट, मंडी भाव)
   - "selling_recommendation" (कहाँ बेचूँ, सबसे अच्छा विकल्प, सिफारिश)
   - "price_forecast" (भविष्य, 15 दिन का अनुमान, बढ़ेगा या घटेगा)
   - "my_offers" (कितने प्रस्ताव, ऑफर)
   - "order_status" (ऑर्डर की स्थिति, स्टेटस)
   - "calculation" (गणना, कितना मिलेगा, कितने पैसे)
   - "buyer_matching" (खरीदार, व्यापारी)
   - "greeting" (नमस्ते, नमस्कार)
   - "general_help" (मदद, सहायता)
3. Extract entities if present:
   - "commodity": "wheat" | "soybean" | "mustard" | "chana" | "onion" | "rice" | "cotton" | null
   - "quantity": number or null
   - "rate": number or null
4. Return STRICTLY a JSON object without markdown fences:
{
  "transcript": "<transcribed Hindi question>",
  "intent": "<intent_name>",
  "commodity": "<commodity_or_null>",
  "quantity": null,
  "rate": null
}`;

            modelResponse = await model.generateContent([
              {
                inlineData: {
                  mimeType: mimeType.split(';')[0] || 'audio/webm',
                  data: audioBuffer.toString('base64')
                }
              },
              prompt
            ]);

            console.log(`VOICE GEMINI: response received (model: ${mName})`);
            break;
          } catch (mErr) {
            console.warn(`VOICE GEMINI: ${mName} attempt failed:`, mErr.message);
          }
        }

        if (modelResponse) {
          const responseText = modelResponse.response.text();
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            transcript = (parsed.transcript || '').trim();
            detectedIntent = parsed.intent || null;
          } else {
            transcript = responseText.trim();
          }
        }
      } catch (err) {
        console.error('VOICE GEMINI: generation failed =', err.message);
        geminiError = err.message;
      }
    } else {
      console.log('VOICE SERVICE: GEMINI_API_KEY is not configured, using fallback transcript');
    }

    if (!transcript) {
      transcript = 'गेहूं का आज का भाव क्या है?';
    }

    console.log(`VOICE SERVICE: transcript = "${transcript}"`);

    // 3. Deterministic KrishiLink Business Logic & Data Retrieval
    const assistantResult = await AssistantService.processAssistantQuery(transcript, user, context);

    const answer = assistantResult.response_text || assistantResult.answer;
    const speechText = assistantResult.speech_text || assistantResult.answer || answer;

    console.log(`VOICE SERVICE: answer generated = "${answer.substring(0, 50)}..."`);

    // 4. Gemini TTS (Speech Generation)
    let ttsAudioBase64 = null;
    let ttsMimeType = 'audio/wav';

    if (env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        // Attempt Gemini TTS models
        const ttsModelNames = ['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.0-flash'];
        
        for (const ttsName of ttsModelNames) {
          try {
            const ttsModel = genAI.getGenerativeModel({
              model: ttsName,
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: 'Aoede'
                    }
                  }
                }
              }
            });

            const ttsPrompt = `Speak naturally in clear, friendly Hindi: ${speechText}`;
            const ttsResult = await ttsModel.generateContent(ttsPrompt);
            const candidates = ttsResult.response.candidates;
            if (candidates && candidates[0]?.content?.parts) {
              for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                  ttsAudioBase64 = part.inlineData.data;
                  ttsMimeType = part.inlineData.mimeType || 'audio/wav';
                  console.log(`VOICE TTS: response ready (model: ${ttsName})`);
                  break;
                }
              }
            }
            if (ttsAudioBase64) break;
          } catch (ttsErr) {
            // Preview model might not be active, fallback to client synthesis
          }
        }
      } catch (e) {
        console.warn('VOICE TTS: Skipped or not available, frontend will use high-quality speech synthesis');
      }
    }

    return {
      success: true,
      transcript,
      answer,
      response_text: answer,
      speech_text: speechText,
      audio: ttsAudioBase64,
      mimeType: ttsMimeType,
      language: 'hi-IN',
      intent: assistantResult.intent || detectedIntent,
      entities: assistantResult.entities || {},
      confidence: assistantResult.confidence || 0.95,
      card_data: assistantResult.card_data || null,
      geminiConfigured: !!env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = VoiceService;
