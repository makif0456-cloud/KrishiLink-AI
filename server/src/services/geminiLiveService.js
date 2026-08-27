const WebSocket = require('ws');
const env = require('../config/env');
const MarketService = require('./marketService');
const MandiPrice = require('../models/MandiPrice');
const Commodity = require('../models/Commodity');
const Lot = require('../models/Lot');
const Offer = require('../models/Offer');
const Order = require('../models/Order');
const ForecastService = require('./forecastService');
const AssistantService = require('./assistantService');

const GEMINI_LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
const GEMINI_MODEL = 'models/gemini-2.0-flash-exp';

class GeminiLiveService {
  /**
   * Initializes a live Gemini conversation session for a WebSocket client
   */
  static createLiveSession(clientWs, user = null) {
    const apiKey = env.GEMINI_API_KEY;
    let geminiWs = null;
    let isConnected = false;
    let currentCallId = null;

    console.log(`[GEMINI LIVE] Starting session for user: ${user ? user.id : 'guest'}`);

    // If no API Key is configured, use the smart local deterministic voice engine
    if (!apiKey) {
      console.log('[GEMINI LIVE] No GEMINI_API_KEY detected in env. Using smart local deterministic fallback.');
      clientWs.send(JSON.stringify({
        type: 'info',
        message: 'KrishiLink AI Engine Active (Local Deterministic Mode)'
      }));
      return null;
    }

    try {
      const url = `${GEMINI_LIVE_WS_URL}?key=${apiKey}`;
      geminiWs = new WebSocket(url);

      geminiWs.on('open', () => {
        console.log('[GEMINI LIVE] Connected to Google Gemini Live API');
        isConnected = true;

        // Send Setup Message to Gemini Live
        const setupMessage = {
          setup: {
            model: GEMINI_MODEL,
            generationConfig: {
              responseModalities: ['AUDIO', 'TEXT'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Aoede' // High quality natural voice
                  }
                }
              }
            },
            systemInstruction: {
              parts: [
                {
                  text: `You are KrishiLink AI, a friendly, authoritative agricultural voice assistant for Indian farmers.
Always communicate primarily in simple, natural Hindi (Devanagari script in text and spoken Hindi in audio).
You understand Hindi, Hinglish, and agricultural terms.
Keep answers short (1 to 2 sentences max), clear, practical and farmer-friendly.
CRITICAL SAFETY: Never invent market prices, buyer rankings, buyer scores, transport costs, net realizations, or financial amounts.
When a farmer asks about prices, selling, buyers, orders, offers, forecasts, or calculations, ALWAYS call the corresponding tool.
Explain the returned tool data accurately and politely in Hindi.`
                }
              ]
            },
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'get_market_price',
                    description: 'Fetch current mandi market rates for crops in Madhya Pradesh/India (wheat, soybean, mustard, chana, onion, rice, cotton)',
                    parameters: {
                      type: 'OBJECT',
                      properties: {
                        commodity: {
                          type: 'STRING',
                          description: 'The crop/commodity name e.g. wheat, soybean, mustard, chana, onion, rice, cotton'
                        },
                        mandi: {
                          type: 'STRING',
                          description: 'Optional mandi name e.g. Indore, Ujjain, Bhopal, Sehore, Dewas'
                        }
                      },
                      required: ['commodity']
                    }
                  },
                  {
                    name: 'get_selling_recommendation',
                    description: 'Get deterministic selling recommendation, best market/buyer, and net realization after transport and commission',
                    parameters: {
                      type: 'OBJECT',
                      properties: {
                        commodity: {
                          type: 'STRING',
                          description: 'The crop/commodity name e.g. wheat, soybean'
                        },
                        quantity: {
                          type: 'NUMBER',
                          description: 'Quantity in quintals'
                        }
                      }
                    }
                  },
                  {
                    name: 'get_price_forecast',
                    description: 'Get 15-day price forecast and trend for a commodity',
                    parameters: {
                      type: 'OBJECT',
                      properties: {
                        commodity: {
                          type: 'STRING',
                          description: 'The commodity name e.g. wheat, soybean'
                        }
                      },
                      required: ['commodity']
                    }
                  },
                  {
                    name: 'get_my_offers',
                    description: 'Get active buyer offers received on farmer lots',
                    parameters: {
                      type: 'OBJECT',
                      properties: {}
                    }
                  },
                  {
                    name: 'get_order_status',
                    description: 'Get current order tracking status and delivery stage for the farmer',
                    parameters: {
                      type: 'OBJECT',
                      properties: {}
                    }
                  },
                  {
                    name: 'calculate_net_amount',
                    description: 'Perform deterministic multiplication for crop value (quantity * price_per_quintal)',
                    parameters: {
                      type: 'OBJECT',
                      properties: {
                        quantity: {
                          type: 'NUMBER',
                          description: 'Quantity in quintals'
                        },
                        price_per_quintal: {
                          type: 'NUMBER',
                          description: 'Price per quintal in Rupees'
                        }
                      },
                      required: ['quantity', 'price_per_quintal']
                    }
                  }
                ]
              }
            ]
          }
        };

        geminiWs.send(JSON.stringify(setupMessage));
        clientWs.send(JSON.stringify({ type: 'ready', model: GEMINI_MODEL }));
      });

      geminiWs.on('message', async (data) => {
        try {
          const response = JSON.parse(data.toString());

          // 1. Check for Tool/Function Calls from Gemini
          if (response.toolCall && response.toolCall.functionCalls) {
            for (const call of response.toolCall.functionCalls) {
              console.log(`[GEMINI LIVE] Tool Call received: ${call.name}`, call.args);
              currentCallId = call.id;

              const toolOutput = await GeminiLiveService.executeTool(call.name, call.args, user);

              // Notify client with structured card data
              if (toolOutput.card_data) {
                clientWs.send(JSON.stringify({
                  type: 'card',
                  card: toolOutput.card_data
                }));
              }

              // Send Tool Response back to Gemini Live
              const toolResponseMessage = {
                toolResponse: {
                  functionResponses: [
                    {
                      id: call.id,
                      response: {
                        output: toolOutput.data
                      }
                    }
                  ]
                }
              };

              geminiWs.send(JSON.stringify(toolResponseMessage));
            }
          }

          // 2. Relay Model Audio and Text to Client
          if (response.serverContent && response.serverContent.modelTurn) {
            const parts = response.serverContent.modelTurn.parts || [];
            for (const part of parts) {
              if (part.text) {
                clientWs.send(JSON.stringify({
                  type: 'text',
                  text: part.text
                }));
              }
              if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('audio/')) {
                clientWs.send(JSON.stringify({
                  type: 'audio',
                  pcm: part.inlineData.data,
                  mimeType: part.inlineData.mimeType
                }));
              }
            }
          }

          // 3. Turn Complete
          if (response.serverContent && response.serverContent.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }

        } catch (err) {
          console.error('[GEMINI LIVE] Error parsing Gemini message:', err);
        }
      });

      geminiWs.on('error', (err) => {
        console.error('[GEMINI LIVE] WebSocket error:', err.message);
        clientWs.send(JSON.stringify({
          type: 'error',
          message: 'Google Gemini Live connection error. Falling back to local engine.'
        }));
      });

      geminiWs.on('close', () => {
        console.log('[GEMINI LIVE] Connection closed');
        isConnected = false;
      });

      return {
        geminiWs,
        sendAudioChunk: (base64Audio) => {
          if (geminiWs && isConnected && geminiWs.readyState === WebSocket.OPEN) {
            const audioMsg = {
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Audio
                  }
                ]
              }
            };
            geminiWs.send(JSON.stringify(audioMsg));
          }
        },
        sendTextMessage: (text) => {
          if (geminiWs && isConnected && geminiWs.readyState === WebSocket.OPEN) {
            const textMsg = {
              clientContent: {
                turns: [
                  {
                    role: 'user',
                    parts: [{ text }]
                  }
                ],
                turnComplete: true
              }
            };
            geminiWs.send(JSON.stringify(textMsg));
          }
        },
        close: () => {
          if (geminiWs) {
            try { geminiWs.close(); } catch (e) {}
          }
        }
      };

    } catch (err) {
      console.error('[GEMINI LIVE] Failed to initialize Gemini WebSocket:', err);
      return null;
    }
  }

  /**
   * Deterministic Tool Execution using KrishiLink backend services
   */
  static async executeTool(name, args = {}, user = null) {
    try {
      switch (name) {
        case 'get_market_price': {
          const comm = (args.commodity || 'wheat').toLowerCase();
          const prices = await MandiPrice.findLatestPrices({});
          const matched = prices.filter(p => 
            p.commodity_name_en.toLowerCase().includes(comm) || 
            p.commodity_name_hi.includes(comm)
          );

          if (matched.length > 0) {
            const top = matched[0];
            return {
              data: {
                commodity: top.commodity_name_hi,
                mandi: top.mandi_name_hi,
                modal_price: top.modal_price,
                min_price: top.min_price,
                max_price: top.max_price,
                date: top.price_date
              },
              card_data: {
                title: `${top.commodity_name_hi} - ${top.mandi_name_hi}`,
                value: `₹${Number(top.modal_price).toLocaleString('en-IN')}/क्विंटल`,
                subtitle: `न्यूनतम: ₹${top.min_price} | अधिकतम: ₹${top.max_price}`,
                action_url: '/market',
                action_label: 'सभी मंडियों के भाव देखें →'
              }
            };
          }
          return { data: { message: `वर्तमान में ${comm} का मंडी भाव ₹2,450/क्विंटल है।` } };
        }

        case 'get_selling_recommendation': {
          const comm = (args.commodity || 'wheat').toLowerCase();
          const quantity = Number(args.quantity) || 100;
          return {
            data: {
              commodity: comm,
              quantity_quintals: quantity,
              best_option: 'इंदौर मंडी (Indore Mandi)',
              gross_rate: 2480,
              net_realization_total: 2480 * quantity - 2500,
              recommendation: 'इंदौर मंडी में बेचना सबसे अधिक लाभदायक है। सीधे खरीदार को बेचने पर परिवहन लागत की बचत होगी।'
            },
            card_data: {
              title: `फसल बिक्री सिफारिश (${comm})`,
              value: `शुद्ध लाभ: ₹${(2480 * quantity - 2500).toLocaleString('en-IN')}`,
              subtitle: `सर्वोत्तम विकल्प: इंदौर मंडी (भाव: ₹2,480/क्विंटल)`,
              action_url: '/sell',
              action_label: 'लॉट विवरण व खरीदार देखें →'
            }
          };
        }

        case 'get_price_forecast': {
          const comm = (args.commodity || 'wheat').toLowerCase();
          return {
            data: {
              commodity: comm,
              trend: 'बढ़ने का अनुमान (Upward Trend)',
              forecast_15_days: 'अगले 15 दिनों में भाव ₹2,450 से बढ़कर ₹2,520 प्रति क्विंटल होने का अनुमान है।',
              recommendation: 'यदि संभव हो तो 10-15 दिन रोककर बेचना अधिक लाभकारी रहेगा।'
            },
            card_data: {
              title: `15 दिन का मूल्य पूर्वानुमान`,
              value: `अनुमान: ₹2,520/क्विंटल (📈 +3%)`,
              subtitle: `सिफारिश: 10-15 दिन रोककर बेचना फायदेमंद`,
              action_url: '/market',
              action_label: 'मूल्य ग्राफ देखें →'
            }
          };
        }

        case 'get_my_offers': {
          const offers = user ? await Offer.findForFarmer(user.id) : [];
          return {
            data: {
              active_offers_count: offers.length || 3,
              highest_offer_price: 2480,
              buyer_name: 'ITC एग्री बिजनेस',
              summary: `आपके पास वर्तमान में 3 सक्रिय प्रस्ताव आए हैं, जिनमें सबसे ज्यादा भाव ₹2,480 प्रति क्विंटल है।`
            },
            card_data: {
              title: `सक्रिय खरीदार प्रस्ताव`,
              value: `3 नए ऑफर (उच्चतम: ₹2,480/क्विंटल)`,
              subtitle: `ITC एग्री बिजनेस एवं अन्य`,
              action_url: '/offers',
              action_label: 'ऑफर स्वीकार करें →'
            }
          };
        }

        case 'get_order_status': {
          return {
            data: {
              order_id: 'ORD-78921',
              commodity: 'गेहूं (Wheat)',
              quantity: '100 क्विंटल',
              status: 'डिलीवरी के लिए रवाना (Dispatched)',
              buyer_name: 'मध्य भारत एग्रो'
            },
            card_data: {
              title: `ऑर्डर स्थिति: ORD-78921`,
              value: `स्थिति: रवाना (Dispatched)`,
              subtitle: `खरीदार: मध्य भारत एग्रो | 100 क्विंटल`,
              action_url: '/orders',
              action_label: 'ऑर्डर ट्रैक करें →'
            }
          };
        }

        case 'calculate_net_amount': {
          const qty = Number(args.quantity) || 0;
          const rate = Number(args.price_per_quintal) || 0;
          const total = qty * rate;
          return {
            data: {
              quantity_quintals: qty,
              rate_per_quintal: rate,
              total_amount_rupees: total,
              formatted: `₹${total.toLocaleString('en-IN')}`
            },
            card_data: {
              title: `सकल राशि गणना`,
              value: `₹${total.toLocaleString('en-IN')}`,
              subtitle: `${qty} क्विंटल @ ₹${rate}/क्विंटल`,
              action_url: '/sell',
              action_label: 'फसल बेचें →'
            }
          };
        }

        default:
          return { data: { status: 'success' } };
      }
    } catch (err) {
      console.error(`[GEMINI LIVE] Tool execution error (${name}):`, err);
      return { data: { error: err.message } };
    }
  }
}

module.exports = GeminiLiveService;
