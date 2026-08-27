const env = require('../config/env');
const MarketService = require('./marketService');
const ForecastService = require('./forecastService');
const RecommendationService = require('./recommendationService');
const BuyerMatchingService = require('./buyerMatchingService');
const Lot = require('../models/Lot');
const Offer = require('../models/Offer');
const Order = require('../models/Order');
const Commodity = require('../models/Commodity');

const AI_SERVICE_URL = env.AI_SERVICE_URL || 'http://localhost:8000';

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

/**
 * Convert numbers into natural Hindi spoken words for clear TTS pronunciation
 */
function numberToHindiWords(num) {
  num = Math.round(Number(num));
  if (isNaN(num) || num === 0) return 'शून्य';
  if (num < 0) return 'माइनस ' + numberToHindiWords(-num);

  let result = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  if (crore > 0) {
    result += (HINDI_ONES[crore] || crore) + ' करोड़ ';
  }

  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh > 0) {
    result += (HINDI_ONES[lakh] || lakh) + ' लाख ';
  }

  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand > 0) {
    result += (HINDI_ONES[thousand] || thousand) + ' हजार ';
  }

  const hundred = Math.floor(num / 100);
  num %= 100;
  if (hundred > 0) {
    result += (HINDI_ONES[hundred] || hundred) + ' सौ ';
  }

  if (num > 0) {
    result += (HINDI_ONES[num] || num) + ' ';
  }

  return result.trim();
}

/**
 * Clean and normalize text for natural Hindi Text-to-Speech
 */
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

  // Clean abbreviations and special symbols for smooth TTS
  str = str.replace(/\/क्विंटल/g, ' प्रति क्विंटल');
  str = str.replace(/\//g, ' प्रति ');
  str = str.replace(/%/g, ' प्रतिशत');
  str = str.replace(/\+/g, ' प्लस ');
  str = str.replace(/[*#•_~`💡🌾📊🎯🤝💼📦🙏📈]/g, ' ');
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

class AssistantService {
  /**
   * Parse query text using FastAPI NLU service or local deterministic fallback
   */
  static async parseIntent(text, userRole = 'farmer', context = {}) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${AI_SERVICE_URL}/api/v1/nlu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          user_role: userRole,
          context
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
      return this.localNluFallback(text, userRole, context);
    } catch (err) {
      // Local Deterministic NLU Fallback
      return this.localNluFallback(text, userRole, context);
    }
  }

  static localNluFallback(text, userRole = 'farmer', context = {}) {
    const query = (text || '').toLowerCase().trim();
    
    // Commodity mapping
    let commodity = null;
    let commodity_id = 'b0000000-0000-0000-0000-000000000001'; // Default: Wheat
    let commodity_name_hi = 'गेहूं (Wheat)';

    if (query.includes('प्याज') || query.includes('onion') || query.includes('pyaz')) {
      commodity = 'onion';
      commodity_id = 'b0000000-0000-0000-0000-000000000005';
      commodity_name_hi = 'प्याज (Onion)';
    } else if (query.includes('सोयाबीन') || query.includes('soybean') || query.includes('soya')) {
      commodity = 'soybean';
      commodity_id = 'b0000000-0000-0000-0000-000000000002';
      commodity_name_hi = 'सोयाबीन (Soybean)';
    } else if (query.includes('सरसों') || query.includes('mustard') || query.includes('sarson')) {
      commodity = 'mustard';
      commodity_id = 'b0000000-0000-0000-0000-000000000003';
      commodity_name_hi = 'सरसों (Mustard)';
    } else if (query.includes('चना') || query.includes('chana')) {
      commodity = 'chana';
      commodity_id = 'b0000000-0000-0000-0000-000000000004';
      commodity_name_hi = 'चना (Chana)';
    } else if (query.includes('चावल') || query.includes('धान') || query.includes('rice')) {
      commodity = 'rice';
      commodity_id = 'b0000000-0000-0000-0000-000000000006';
      commodity_name_hi = 'धान / चावल (Paddy/Rice)';
    } else if (query.includes('कपास') || query.includes('cotton')) {
      commodity = 'cotton';
      commodity_id = 'b0000000-0000-0000-0000-000000000007';
      commodity_name_hi = 'कपास (Cotton)';
    } else if (query.includes('गेहूं') || query.includes('wheat') || query.includes('gehu')) {
      commodity = 'wheat';
      commodity_id = 'b0000000-0000-0000-0000-000000000001';
      commodity_name_hi = 'गेहूं (Wheat)';
    } else if (context && (context.commodity || context.commodity_id)) {
      // Inherit from conversational context
      const ctxComm = context.commodity || context.commodity_id;
      if (ctxComm === 'onion' || ctxComm === 'b0000000-0000-0000-0000-000000000005') {
        commodity = 'onion';
        commodity_id = 'b0000000-0000-0000-0000-000000000005';
        commodity_name_hi = 'प्याज (Onion)';
      } else if (ctxComm === 'soybean' || ctxComm === 'b0000000-0000-0000-0000-000000000002') {
        commodity = 'soybean';
        commodity_id = 'b0000000-0000-0000-0000-000000000002';
        commodity_name_hi = 'सोयाबीन (Soybean)';
      } else if (ctxComm === 'mustard' || ctxComm === 'b0000000-0000-0000-0000-000000000003') {
        commodity = 'mustard';
        commodity_id = 'b0000000-0000-0000-0000-000000000003';
        commodity_name_hi = 'सरसों (Mustard)';
      } else if (ctxComm === 'chana' || ctxComm === 'b0000000-0000-0000-0000-000000000004') {
        commodity = 'chana';
        commodity_id = 'b0000000-0000-0000-0000-000000000004';
        commodity_name_hi = 'चना (Chana)';
      } else if (ctxComm === 'rice' || ctxComm === 'b0000000-0000-0000-0000-000000000006') {
        commodity = 'rice';
        commodity_id = 'b0000000-0000-0000-0000-000000000006';
        commodity_name_hi = 'धान / चावल (Paddy/Rice)';
      } else if (ctxComm === 'cotton' || ctxComm === 'b0000000-0000-0000-0000-000000000007') {
        commodity = 'cotton';
        commodity_id = 'b0000000-0000-0000-0000-000000000007';
        commodity_name_hi = 'कपास (Cotton)';
      } else {
        commodity = 'wheat';
        commodity_id = 'b0000000-0000-0000-0000-000000000001';
        commodity_name_hi = 'गेहूं (Wheat)';
      }
    }

    // Number extraction for calculations
    let quantity = null;
    let rate = null;

    const numbers = query.match(/\b\d+(?:\.\d+)?\b/g);
    if (numbers && numbers.length >= 2) {
      const n1 = parseFloat(numbers[0]);
      const n2 = parseFloat(numbers[1]);
      if (n1 > 500 && n2 <= 500) {
        rate = n1;
        quantity = n2;
      } else {
        quantity = n1;
        rate = n2;
      }
    } else if (numbers && numbers.length === 1) {
      const n = parseFloat(numbers[0]);
      if (n > 500) rate = n;
      else quantity = n;
    }

    let intent = 'general_help';
    
    // 0. Calculation Intent (Financial value multiplication)
    const isCalcQuery = query.includes('कितना मिलेगा') || 
                        query.includes('कितने पैसे') || 
                        query.includes('कितने का होगा') || 
                        query.includes('कितना बनेगा') ||
                        query.includes('कितने रुपये') ||
                        query.includes('kitna milega') || 
                        query.includes('kitne paise') || 
                        query.includes('kitne ka hoga') || 
                        query.includes('kitna banega') ||
                        query.includes('calculate') || 
                        query.includes('गणना') ||
                        (query.includes('बेचूं तो') && numbers && numbers.length >= 1) ||
                        (query.includes('बेचने पर') && numbers && numbers.length >= 1);

    if (isCalcQuery) {
      intent = 'calculation';
    } else if (query.includes('नमस्ते') || query.includes('नमस्कार') || query.includes('राम राम') || query.includes('प्रणाम') || query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('namaste') || query.includes('namaskar')) {
      intent = 'greeting';
    } else if (query.includes('ऑर्डर') || query.includes('order') || query.includes('स्थिति') || query.includes('स्टेटस') || query.includes('क्या हुआ मेरे ऑर्डर') || query.includes('क्या स्टेटस है') || query.includes('kaha tak pahuncha') || query.includes('status kya hai') || query.includes('stage par hai')) {
      intent = 'order_status';
    } else if (query.includes('प्रस्ताव') || query.includes('offer') || query.includes('offers') || query.includes('बोली') || query.includes('कितने ऑफर') || query.includes('kitne offer') || query.includes('offers mile') || query.includes('highest offer') || query.includes('prastav')) {
      intent = 'my_offers';
    } else if (query.includes('भविष्य') || query.includes('अनुमान') || query.includes('पूर्वानुमान') || query.includes('forecast') || query.includes('आगे क्या') || query.includes('आगे का') || query.includes('बढ़ेगा') || query.includes('घटेगा') || query.includes('ऊपर जाएगा') || query.includes('नीचे जाएगा') || query.includes('15 दिन') || query.includes('15 days') || query.includes('पंद्रह दिन') || query.includes('badhega') || query.includes('ghatega') || query.includes('upar jayega') || /(^|\s)कल(\s|$| का| के| को)/.test(query)) {
      intent = 'price_forecast';
    } else if (query.includes('विकल्प') || (query.includes('कहाँ') && query.includes('बेच')) || (query.includes('कहा') && query.includes('बेच')) || query.includes('बेचूं') || query.includes('बेचू') || query.includes('बेचूँ') || query.includes('बेचना') || query.includes('बेचनी') || query.includes('फायदा') || query.includes('सिफारिश') || query.includes('recommendation') || query.includes('लाभ') || query.includes('मुनाफा') || query.includes('best option') || query.includes('sahi samay') || query.includes('sahi rahega') || query.includes('kise bechu') || query.includes('kisko bechu') || query.includes('kaha bechna') || query.includes('kaha bechu')) {
      intent = 'selling_recommendation';
    } else if (query.includes('खरीदार') || query.includes('buyer') || query.includes('buyers') || query.includes('व्यापारी') || query.includes('बायर') || query.includes('कौन खरीदेगा') || query.includes('kaun khareedega') || query.includes('achhe buyer') || query.includes('vyapari')) {
      intent = 'buyer_matching';
    } else if (query.includes('मेरी फसल') || query.includes('मेरे लॉट') || query.includes('my lot') || query.includes('my crop') || query.includes('कितना क्विंटल') || query.includes('मेरी उपज') || query.includes('कौन सी फसल') || query.includes('meri fasal')) {
      intent = 'my_lots';
    } else if (query.includes('नया लॉट') || query.includes('बेचना है') || query.includes('create lot') || query.includes('नई फसल') || query.includes('फसल बेचें') || query.includes('sell crop')) {
      intent = 'create_lot';
    } else if (query.includes('भाव') || query.includes('कीमत') || query.includes('रेट') || query.includes('दाम') || query.includes('मूल्य') || query.includes('price') || query.includes('rate') || query.includes('mandi') || query.includes('मंडी') || query.includes('bhav') || query.includes('rate kya hai') || query.includes('bhav kya chal raha') || query.includes('kitne ka hai') || query.includes('bhav batao') || query.includes('rate batao')) {
      intent = 'market_price';
    } else if (commodity) {
      intent = 'market_price';
    }

    return {
      query: text,
      intent,
      entities: {
        commodity,
        commodity_id,
        commodity_name_hi,
        quantity: quantity || 100,
        rate: rate || 2480
      },
      confidence: 0.95,
      suggested_action: 'view_prices'
    };
  }

  /**
   * Process complete assistant query with deterministic business logic
   */
  static async processAssistantQuery(text, user = null, context = {}) {
    const userRole = user?.role || 'farmer';
    const userId = user?.id || null;

    // 1. Get structured Intent & Entities
    const nluResult = await this.parseIntent(text, userRole, { ...context, userId });
    const { intent, entities } = nluResult;
    const commodityId = entities?.commodity_id || 'b0000000-0000-0000-0000-000000000001';
    const commodityNameHi = entities?.commodity_name_hi || 'गेहूं (Wheat)';

    let responseText = '';
    let speechText = '';
    let cardData = null;

    switch (intent) {
      // -------------------------------------------------------------
      // 0. Greeting / Welcome
      // -------------------------------------------------------------
      case 'greeting': {
        responseText = `🙏 **नमस्ते! मैं कृषि-लिंक AI सहायक हूँ।**\n\n` +
          `मैं आपकी फसल का सही दाम पाने, सही खरीदार खोजने और ऑर्डर ट्रैक करने में मदद कर सकता हूँ।\n\n` +
          `आप मुझसे पूछ सकते हैं:\n` +
          `• "गेहूं का आज का भाव क्या है?"\n` +
          `• "मेरी फसल कहाँ बेचनी चाहिए?"\n` +
          `• "गेहूं का भाव अगले 15 दिन में बढ़ेगा?"\n` +
          `• "मेरे कितने प्रस्ताव आए हैं?"\n` +
          `• "अगर 100 क्विंटल गेहूं ₹2480 में बेचूं तो कितना मिलेगा?"`;

        speechText = `नमस्ते! मैं KrishiLink AI हूँ। आप मुझसे अपनी फसल, मंडी भाव, खरीदार, ऑफर या ऑर्डर के बारे में पूछ सकते हैं।`;

        cardData = {
          title: 'कृषि-लिंक AI सहायक',
          value: 'नमस्ते!',
          subtitle: 'मंडी भाव • बिक्री विकल्प • ऑर्डर ट्रैकिंग',
          action_url: '/market',
          action_label: 'मंडी भाव देखें →'
        };
        break;
      }

      // -------------------------------------------------------------
      // 1. Calculation (Deterministic Crop Value Calculation)
      // -------------------------------------------------------------
      case 'calculation': {
        const qty = Number(entities?.quantity || context.quantity || 100);
        const price = Number(entities?.rate || context.rate || 2480);
        const total = Math.round(qty * price);

        responseText = `🌾 **फसल मूल्य गणना (Value Calculation):**\n\n` +
          `• **फसल:** ${commodityNameHi}\n` +
          `• **मात्रा:** ${qty} क्विंटल\n` +
          `• **भाव:** ₹${price.toLocaleString('en-IN')}/क्विंटल\n` +
          `• **कुल अनुमानित राशि:** **₹${total.toLocaleString('en-IN')}**\n\n` +
          `💡 यह कुल सकल मूल्य है। वास्तविक शुद्ध प्राप्ति में से परिवहन व मंडी खर्च घट सकते हैं।`;

        speechText = `${numberToHindiWords(qty)} क्विंटल ${commodityNameHi.split(' ')[0]} को ${numberToHindiWords(price)} रुपये प्रति क्विंटल के भाव पर बेचने पर कुल ${numberToHindiWords(total)} रुपये मिलेंगे।`;

        cardData = {
          title: 'फसल मूल्य गणना',
          value: `₹${total.toLocaleString('en-IN')}`,
          subtitle: `${qty} क्विंटल @ ₹${price.toLocaleString('en-IN')}/क्विंटल`,
          action_url: '/sell',
          action_label: 'नया लॉट बनाएं →'
        };
        break;
      }

      // -------------------------------------------------------------
      // 2. Market Price Discovery
      // -------------------------------------------------------------
      case 'market_price': {
        const prices = await MarketService.getPrices({ commodity_id: commodityId, limit: 3 });
        const list = prices?.data || [];
        const topMandi = list[0] || { mandi_name_hi: 'भोपाल करोंद', modal_price: 2450 };
        
        responseText = `🌾 **${commodityNameHi} का आज का मंडी भाव:**\n\n` +
          `• **${topMandi.mandi_name_hi || 'भोपाल'}**: ₹${Number(topMandi.modal_price).toLocaleString('en-IN')}/क्विंटल (न्यूनतम: ₹${Number(topMandi.min_price || topMandi.modal_price - 50).toLocaleString('en-IN')}, उच्चतम: ₹${Number(topMandi.max_price || topMandi.modal_price + 80).toLocaleString('en-IN')})\n` +
          (list[1] ? `• **${list[1].mandi_name_hi}**: ₹${Number(list[1].modal_price).toLocaleString('en-IN')}/क्विंटल\n` : '') +
          (list[2] ? `• **${list[2].mandi_name_hi}**: ₹${Number(list[2].modal_price).toLocaleString('en-IN')}/क्विंटल\n` : '') +
          `\n📈 **आज का रुझान:** आवक अच्छी है और मांग स्थिर बनी हुई है।`;

        speechText = `${commodityNameHi.split(' ')[0]} का आज का मुख्य भाव ${numberToHindiWords(topMandi.modal_price)} रुपये प्रति क्विंटल है।`;

        cardData = {
          title: `${commodityNameHi} - मंडी भाव`,
          value: `₹${Number(topMandi.modal_price).toLocaleString('en-IN')}/क्विंटल`,
          subtitle: `मुख्य मंडी: ${topMandi.mandi_name_hi || 'भोपाल'}`,
          action_url: '/market',
          action_label: 'सभी मंडियों के भाव देखें →'
        };
        break;
      }

      // -------------------------------------------------------------
      // 3. Price Forecasting (15 Days)
      // -------------------------------------------------------------
      case 'price_forecast': {
        const forecast = await ForecastService.getForecast(commodityId, 15);
        const projectedPrice = forecast?.projected_end_price || 2580;
        const trendHi = forecast?.trend_label_hi || 'बढ़त का रुझान';
        const changePct = forecast?.change_pct || 2.4;

        responseText = `📊 **${commodityNameHi} का 15-दिवसीय मूल्य पूर्वानुमान:**\n\n` +
          `• वर्तमान औसत भाव: **₹${Number(forecast?.current_modal_price || 2450).toLocaleString('en-IN')}/क्विंटल**\n` +
          `• 15 दिन बाद अनुमानित भाव: **₹${Number(projectedPrice).toLocaleString('en-IN')}/क्विंटल**\n` +
          `• अनुमानित बदलाव: **${changePct >= 0 ? '+' : ''}${changePct}% (${trendHi})**\n\n` +
          `💡 **सुझाव:** यदि आपके पास सुरक्षित भंडारण की सुविधा है, तो आने वाले दिनों में बेहतर दाम मिलने की संभावना है।`;

        speechText = `${commodityNameHi.split(' ')[0]} के भाव में 15 दिनों में ${trendHi} रहने का अनुमान है। अनुमानित भाव ${numberToHindiWords(projectedPrice)} रुपये प्रति क्विंटल है।`;

        cardData = {
          title: `15 दिन का मूल्य पूर्वानुमान`,
          value: `₹${Number(projectedPrice).toLocaleString('en-IN')}`,
          trend: trendHi,
          subtitle: `बदलाव: ${changePct >= 0 ? '+' : ''}${changePct}%`,
          action_url: '/market',
          action_label: 'विस्तृत ट्रेंड चार्ट देखें →'
        };
        break;
      }

      // -------------------------------------------------------------
      // 4. Selling Recommendation & Net Realization
      // -------------------------------------------------------------
      case 'selling_recommendation': {
        let lot = null;
        if (userId) {
          const userLots = await Lot.findByFarmer(userId);
          lot = userLots.find(l => l.status === 'active') || userLots[0];
        }

        if (lot) {
          const rec = await RecommendationService.getSellingRecommendations(lot.id, 25);
          const topOption = rec?.recommendation || {};
          const diff = rec?.net_difference_amount || 0;

          responseText = `🎯 **आपकी ${lot.commodity_name_hi || 'फसल'} (लॉट #${lot.id.slice(0, 6)}) के लिए सर्वश्रेष्ठ बिक्री विकल्प:**\n\n` +
            `• **सर्वश्रेष्ठ विकल्प:** ${topOption.buyer_name || 'शर्मा एग्रो ट्रेडर्स'}\n` +
            `• **शुद्ध प्राप्त राशि (Net Realization):** ₹${Number(topOption.net_realization_per_quintal || 2480).toLocaleString('en-IN')}/क्विंटल\n` +
            `• **कुल अतिरिक्त मुनाफा:** ₹${Number(diff).toLocaleString('en-IN')} (मंडी के मुकाबले अधिक बचत)\n\n` +
            `✅ खेत से सीधा पिकअप होने के कारण परिवहन व पल्लेदारी का खर्च बचता है।`;

          speechText = `आपकी फसल के लिए सबसे अच्छा विकल्प ${topOption.buyer_name || 'सत्यापित खरीदार'} है, जिससे आपको ${numberToHindiWords(Math.round(diff))} रुपये ज्यादा शुद्ध मुनाफा मिलेगा।`;

          cardData = {
            title: `स्मार्ट बिक्री सिफारिश`,
            value: `+₹${Number(diff).toLocaleString('en-IN')} अधिक मुनाफा`,
            subtitle: `विकल्प: ${topOption.buyer_name || 'डायरेक्ट खरीदार'}`,
            action_url: `/recommendations/${lot.id}`,
            action_label: 'सिफारिश व नेट तुलना देखें →'
          };
        } else {
          responseText = `🎯 **फसल बिक्री सिफारिश (Selling Intelligence):**\n\n` +
            `• **मंडी विकल्प:** भोपाल मंडी में ₹2,450/क्विंटल (परिवहन व लोडिंग खर्च उपरांत शुद्ध: ₹2,385/क्विंटल)\n` +
            `• **डायरेक्ट खरीदार:** शर्मा एग्रो में ₹2,450/क्विंटल (खेत से मुफ्त उठान, शुद्ध: ₹2,450/क्विंटल)\n\n` +
            `💡 अपनी फसल का नया लॉट जोड़ें ताकि हम सटीक दूरी व शुद्ध मुनाफे की गणना कर सकें।`;

          speechText = `अपनी फसल को सीधे सत्यापित खरीदार को बेचने पर परिवहन और कमीशन की पूरी बचत होती है।`;

          cardData = {
            title: `फसल बिक्री सिफारिश`,
            value: `खेत से सीधा उठान`,
            subtitle: `परिवहन व कमीशन की बचत`,
            action_url: '/sell',
            action_label: 'नई फसल लॉट जोड़ें →'
          };
        }
        break;
      }

      // -------------------------------------------------------------
      // 5. Buyer Matching
      // -------------------------------------------------------------
      case 'buyer_matching': {
        let lot = null;
        if (userId) {
          const userLots = await Lot.findByFarmer(userId);
          lot = userLots.find(l => l.status === 'active') || userLots[0];
        }

        if (lot) {
          const matches = await BuyerMatchingService.getMatchingBuyers(lot.id, 3);
          const topBuyer = matches?.matches?.[0] || { buyer_name: 'शर्मा एग्रो ट्रेडर्स', match_score: 92, offered_price: 2450 };

          responseText = `🤝 **आपकी फसल के लिए शीर्ष खरीदार (Top Buyer Matches):**\n\n` +
            `1. **${topBuyer.business_name || topBuyer.buyer_name}** (मैच स्कोर: ${topBuyer.match_score || 92}%)\n` +
            `   • प्रस्तावित भाव: ₹${Number(topBuyer.offered_price || 2450).toLocaleString('en-IN')}/क्विंटल\n` +
            `   • दूरी: ${topBuyer.distance_km || 18} किमी (डिलीवरी पर तुरंत भुगतान)\n\n` +
            `💡 आप खरीदार को तुरंत डिजिटल प्रस्ताव भेज सकते हैं।`;

          speechText = `आपकी फसल के लिए सबसे अच्छा खरीदार ${topBuyer.business_name || topBuyer.buyer_name} है जिसका मैच स्कोर ${numberToHindiWords(topBuyer.match_score || 92)} प्रतिशत है।`;

          cardData = {
            title: `शीर्ष खरीदार मैच`,
            value: `${topBuyer.match_score || 92}% मैच स्कोर`,
            subtitle: topBuyer.business_name || topBuyer.buyer_name,
            action_url: `/my-lots/${lot.id}`,
            action_label: 'खरीदार विवरण व प्रस्ताव देखें →'
          };
        } else {
          responseText = `🤝 **सत्यापित खरीदार नेटवर्क (Verified Buyers):**\n\n` +
            `मध्य प्रदेश में 40+ सत्यापित एग्रो प्रोसेसर और थोक खरीदार सक्रिय हैं। गेहूं, सोयाबीन और सरसों के लिए तत्काल मांग उपलब्ध है।`;

          speechText = `हमारे नेटवर्क में चालीस से अधिक सत्यापित खरीदार सक्रिय हैं।`;

          cardData = {
            title: `सत्यापित खरीदार`,
            value: `40+ खरीदार सक्रिय`,
            subtitle: `तत्काल भुगतान गारंटी`,
            action_url: '/sell',
            action_label: 'फसल जोड़ें और खरीदार खोजें →'
          };
        }
        break;
      }

      // -------------------------------------------------------------
      // 6. My Lots
      // -------------------------------------------------------------
      case 'my_lots': {
        if (!userId) {
          responseText = `🌾 आपके लॉट देखने के लिए कृपया लॉगिन करें।`;
          speechText = `कृपया अपने लॉट देखने के लिए लॉगिन करें।`;
          cardData = { title: 'लॉगिन आवश्यक', value: 'लॉगिन करें', action_url: '/login', action_label: 'लॉगिन करें →' };
          break;
        }

        const lots = await Lot.findByFarmer(userId);
        if (lots.length === 0) {
          responseText = `🌾 आपके पास अभी कोई सक्रिय फसल लॉट नहीं है। नया लॉट जोड़ने के लिए "फसल बेचें" पर क्लिक करें।`;
          speechText = `आपके पास अभी कोई सक्रिय लॉट नहीं है।`;
          cardData = { title: 'मेरी फसलें', value: '0 सक्रिय लॉट', action_url: '/sell', action_label: 'नया लॉट बनाएं →' };
        } else {
          const activeLots = lots.filter(l => l.status === 'active');
          const totalQty = lots.reduce((sum, l) => sum + Number(l.quantity || 0), 0);

          responseText = `🌾 **आपकी फसल लॉट सूची (${lots.length} कुल लॉट):**\n\n` +
            `• कुल दर्ज मात्रा: **${totalQty} क्विंटल**\n` +
            `• सक्रिय बिक्री लॉट: **${activeLots.length}**\n\n` +
            lots.slice(0, 3).map(l => `• **${l.commodity_name_hi || 'फसल'}**: ${l.quantity} क्विंटल (अपेक्षित भाव: ₹${Number(l.expected_price).toLocaleString('en-IN')}, स्थिति: ${l.status === 'active' ? 'सक्रिय' : l.status === 'sold' ? 'बिक गई' : l.status})`).join('\n');

          speechText = `आपके पास कुल ${numberToHindiWords(lots.length)} लॉट हैं, जिनकी कुल मात्रा ${numberToHindiWords(totalQty)} क्विंटल है।`;

          cardData = {
            title: `मेरी फसलें`,
            value: `${totalQty} क्विंटल`,
            subtitle: `${activeLots.length} सक्रिय लॉट`,
            action_url: '/my-lots',
            action_label: 'सभी लॉट देखें →'
          };
        }
        break;
      }

      // -------------------------------------------------------------
      // 7. My Offers
      // -------------------------------------------------------------
      case 'my_offers': {
        if (!userId) {
          responseText = `💼 प्राप्त प्रस्ताव देखने के लिए कृपया किसान खाते में लॉगिन करें।`;
          speechText = `कृपया प्रस्ताव देखने के लिए लॉगिन करें।`;
          cardData = { title: 'लॉगिन आवश्यक', value: 'लॉगिन करें', action_url: '/login', action_label: 'लॉगिन करें →' };
          break;
        }

        const lots = await Lot.findByFarmer(userId);
        let totalOffersCount = 0;
        for (const l of lots) {
          const offers = await Offer.findByLot(l.id);
          totalOffersCount += offers.length;
        }

        responseText = `💼 **आपके प्राप्त डिजिटल प्रस्ताव:**\n\n` +
          `• कुल प्राप्त प्रस्ताव: **${totalOffersCount}**\n` +
          `• आप अपने लॉट विवरण पृष्ठ पर जाकर किसी भी प्रस्ताव को **स्वीकार (Accept)** या **काउंटर (Counter)** कर सकते हैं।`;

        speechText = `आपको कुल ${numberToHindiWords(totalOffersCount)} डिजिटल प्रस्ताव प्राप्त हुए हैं।`;

        cardData = {
          title: `प्राप्त प्रस्ताव`,
          value: `${totalOffersCount} प्रस्ताव`,
          subtitle: `स्वीकार या काउंटर करें`,
          action_url: '/my-lots',
          action_label: 'प्रस्ताव देखें →'
        };
        break;
      }

      // -------------------------------------------------------------
      // 8. Order Status / My Orders
      // -------------------------------------------------------------
      case 'order_status': {
        if (!userId) {
          responseText = `📦 ऑर्डर की स्थिति देखने के लिए कृपया लॉगिन करें।`;
          speechText = `कृपया ऑर्डर स्थिति देखने के लिए लॉगिन करें।`;
          cardData = { title: 'लॉगिन आवश्यक', value: 'लॉगिन करें', action_url: '/login', action_label: 'लॉगिन करें →' };
          break;
        }

        const orders = await Order.findByUser(userId, userRole);
        if (orders.length === 0) {
          responseText = `📦 आपके पास अभी कोई सक्रिय या पूर्ण ऑर्डर नहीं है। जब आप कोई प्रस्ताव स्वीकार करेंगे, तो ऑर्डर यहां दिखाई देगा।`;
          speechText = `आपके पास अभी कोई सक्रिय ऑर्डर नहीं है।`;
          cardData = { title: 'मेरे ऑर्डर', value: '0 ऑर्डर', action_url: '/orders', action_label: 'ऑर्डर पृष्ठ देखें →' };
        } else {
          const latestOrder = orders[0];
          const statusHi = latestOrder.status === 'confirmed' ? 'पुष्टि (Confirmed)' :
                           latestOrder.status === 'dispatched' ? 'रवाना (Dispatched)' :
                           latestOrder.status === 'delivered' ? 'पहुँच गई (Delivered)' :
                           latestOrder.status === 'completed' ? 'पूर्ण (Completed)' : latestOrder.status;

          responseText = `📦 **आपके नवीनतम ऑर्डर की स्थिति (ऑर्डर #${latestOrder.id.slice(0, 8)}):**\n\n` +
            `• **वर्तमान स्थिति:** ${statusHi}\n` +
            `• **कुल राशि:** ₹${Number(latestOrder.total_amount).toLocaleString('en-IN')}\n` +
            `• **सहमति भाव:** ₹${Number(latestOrder.agreed_price).toLocaleString('en-IN')}/क्विंटल\n` +
            `• **खरीदार:** ${latestOrder.buyer_business_name || latestOrder.buyer_name || 'शर्मा ट्रेडर्स'}`;

          speechText = `आपके नवीनतम ऑर्डर की स्थिति ${statusHi} है और कुल राशि ${numberToHindiWords(Math.round(latestOrder.total_amount))} रुपये है।`;

          cardData = {
            title: `ऑर्डर #${latestOrder.id.slice(0, 8)}`,
            value: statusHi,
            subtitle: `₹${Number(latestOrder.total_amount).toLocaleString('en-IN')}`,
            action_url: `/orders/${latestOrder.id}`,
            action_label: 'लाइव ट्रैकिंग देखें →'
          };
        }
        break;
      }

      // -------------------------------------------------------------
      // 9. Create Lot
      // -------------------------------------------------------------
      case 'create_lot': {
        responseText = `🌾 **अपनी फसल बेचने के लिए नया लॉट बनाएं:**\n\n` +
          `1. फसल का चयन करें (जैसे गेहूं, सोयाबीन)\n` +
          `2. मात्रा और गुणवत्ता ग्रेड भरें\n` +
          `3. अपेक्षित भाव दर्ज करें\n` +
          `4. अपने खेत का स्थान चुनें और तुरंत सबमिट करें!`;

        speechText = `फसल बेचने के लिए केवल पांच आसान चरणों में नया लॉट बनाएं।`;

        cardData = {
          title: `नई फसल बेचें`,
          value: `5 आसान चरण`,
          subtitle: `सीधे खरीदारों तक पहुंचें`,
          action_url: '/sell',
          action_label: 'फसल लॉट बनाएं →'
        };
        break;
      }

      // -------------------------------------------------------------
      // 10. General Help
      // -------------------------------------------------------------
      default: {
        responseText = `🙏 **नमस्ते! मैं कृषि-लिंक एआई सहायक हूँ।**\n\n` +
          `आप मुझसे बोलकर या लिखकर पूछ सकते हैं:\n` +
          `• "गेहूं का आज का भाव क्या है?"\n` +
          `• "मेरी फसल कहाँ बेचनी चाहिए?"\n` +
          `• "गेहूं का भाव अगले 15 दिन में बढ़ेगा?"\n` +
          `• "मेरे कितने प्रस्ताव आए हैं?"\n` +
          `• "अगर 100 क्विंटल गेहूं ₹2480 में बेचूं तो कितना मिलेगा?"`;

        speechText = `नमस्ते! आप मुझसे किसी भी फसल का मंडी भाव, बिक्री सिफारिश, पूर्वानुमान या ऑर्डर का स्टेटस पूछ सकते हैं।`;

        cardData = {
          title: `कृषि-लिंक एआई सहायक`,
          value: `सहायता उपलब्ध`,
          subtitle: `मंडी भाव, सिफारिश व ऑर्डर`,
          action_url: '/market',
          action_label: 'बाजार भाव देखें →'
        };
        break;
      }
    }

    const finalSpeechText = cleanSpokenHindiText(speechText);

    return {
      query: text,
      intent,
      entities,
      confidence: nluResult.confidence || 0.95,
      answer: responseText,
      response_text: responseText,
      speech_text: finalSpeechText,
      language: 'hi',
      card_data: cardData,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AssistantService;
