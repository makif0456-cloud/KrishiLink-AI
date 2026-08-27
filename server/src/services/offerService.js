const Offer = require('../models/Offer');
const Lot = require('../models/Lot');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

class OfferService {
  static async createOffer(buyerId, offerData) {
    const lot = await Lot.findById(offerData.lot_id);
    if (!lot) {
      const err = new Error('फसल विवरण नहीं मिला (Lot not found)');
      err.statusCode = 404;
      throw err;
    }

    if (lot.status === 'sold' || lot.status === 'cancelled') {
      const err = new Error('यह फसल अब बिक्री के लिए उपलब्ध नहीं है (Lot is no longer active)');
      err.statusCode = 400;
      throw err;
    }

    if (!offerData.offered_price || Number(offerData.offered_price) <= 0) {
      const err = new Error('मान्य प्रस्ताव मूल्य आवश्यक है (Valid offered price is required)');
      err.statusCode = 400;
      throw err;
    }

    const totalAmount = Number(offerData.offered_price) * Number(lot.quantity);

    const offer = await Offer.create({
      lot_id: lot.id,
      buyer_id: buyerId,
      offered_price: Number(offerData.offered_price),
      total_amount: totalAmount,
      pickup_offered: offerData.pickup_offered || false,
      payment_terms: offerData.payment_terms || 'on_delivery',
      notes: offerData.notes || ''
    });

    // Update lot status to offer_received if currently active
    if (lot.status === 'active') {
      await Lot.updateStatus(lot.id, 'offer_received');
    }

    await AuditLog.create({
      userId: buyerId,
      action: 'create_offer',
      entityType: 'offer',
      entityId: offer.id,
      details: { lot_id: lot.id, offered_price: offer.offered_price, total_amount: totalAmount }
    });

    return offer;
  }

  static async getOffersForLot(lotId, userId, role) {
    const lot = await Lot.findById(lotId);
    if (!lot) {
      const err = new Error('फसल विवरण नहीं मिला (Lot not found)');
      err.statusCode = 404;
      throw err;
    }

    if (role === 'farmer' && lot.farmer_id !== userId) {
      const err = new Error('आप केवल अपनी फसल के प्रस्ताव देख सकते हैं (Unauthorized to view offers for this lot)');
      err.statusCode = 403;
      throw err;
    }

    return Offer.findByLot(lotId);
  }

  static async getBuyerOffers(buyerId) {
    return Offer.findByBuyer(buyerId);
  }

  static async getOfferDetail(id) {
    const offer = await Offer.findById(id);
    if (!offer) {
      const err = new Error('प्रस्ताव नहीं मिला (Offer not found)');
      err.statusCode = 404;
      throw err;
    }
    return offer;
  }

  static async acceptOffer(offerId, userId) {
    const offer = await Offer.findById(offerId);

    if (!offer) {
      const err = new Error('प्रस्ताव नहीं मिला (Offer not found)');
      err.statusCode = 404;
      throw err;
    }

    // Verify that the user is either the owner farmer or the buyer
    if (offer.farmer_id !== userId && offer.buyer_id !== userId) {
      const err = new Error(
        'केवल संबंधित किसान या खरीदार इस प्रस्ताव को स्वीकार कर सकता है (Only the owner farmer or buyer can accept this offer)'
      );
      err.statusCode = 403;
      throw err;
    }

    // Only pending or countered offers can be accepted
    if (offer.status !== 'pending' && offer.status !== 'countered') {
      const err = new Error(
        `यह प्रस्ताव वर्तमान स्थिति (${offer.status}) में स्वीकार नहीं किया जा सकता (Cannot accept offer in ${offer.status} state)`
      );
      err.statusCode = 400;
      throw err;
    }

    // Get the actual lot
    const lot = await Lot.findById(offer.lot_id);

    if (!lot) {
      const err = new Error('फसल विवरण नहीं मिला (Lot not found)');
      err.statusCode = 404;
      throw err;
    }

    // Lot must still be available
    if (lot.status === 'sold' || lot.status === 'cancelled') {
      const err = new Error(
        'यह फसल अब बिक्री के लिए उपलब्ध नहीं है (Lot is no longer available)'
      );
      err.statusCode = 400;
      throw err;
    }

    // Final agreed price
    const agreedPrice =
      offer.status === 'countered' && offer.counter_price
        ? Number(offer.counter_price)
        : Number(offer.offered_price);

    if (!Number.isFinite(agreedPrice) || agreedPrice <= 0) {
      const err = new Error('अमान्य सहमत मूल्य (Invalid agreed price)');
      err.statusCode = 400;
      throw err;
    }

    // Use the REAL quantity from the lot
    const lotQty = Number(lot.quantity);

    if (!Number.isFinite(lotQty) || lotQty <= 0) {
      const err = new Error('अमान्य लॉट मात्रा (Invalid lot quantity)');
      err.statusCode = 400;
      throw err;
    }

    const totalAmount = agreedPrice * lotQty;

    // 1. Accept offer
    const updatedOffer = await Offer.updateStatus(
      offerId,
      'accepted'
    );

    if (!updatedOffer) {
      const err = new Error(
        'प्रस्ताव अपडेट नहीं हो सका (Offer update failed)'
      );
      err.statusCode = 500;
      throw err;
    }

    // 2. Mark lot as sold
    const updatedLot = await Lot.updateStatus(
      offer.lot_id,
      'sold'
    );

    if (!updatedLot) {
      const err = new Error(
        'फसल अपडेट नहीं हो सकी (Lot update failed)'
      );
      err.statusCode = 500;
      throw err;
    }

    // 3. Create order
    const order = await Order.create({
      offer_id: offer.id,
      lot_id: offer.lot_id,
      farmer_id: offer.farmer_id,
      buyer_id: offer.buyer_id,
      agreed_price: agreedPrice,
      quantity: lotQty,
      total_amount: totalAmount,
      transport_cost: offer.pickup_offered ? 0 : 2500,
      loading_cost: 800
    });

    // 4. Audit log
    await AuditLog.create({
      userId: userId,
      action: 'accept_offer',
      entityType: 'offer',
      entityId: offerId,
      details: {
        order_id: order.id,
        agreed_price: agreedPrice,
        quantity: lotQty,
        total_amount: totalAmount
      }
    });

    return {
      offer: updatedOffer,
      order
    };
  }
  static async rejectOffer(offerId, userId) {
    const offer = await Offer.findById(offerId);
    if (!offer) {
      const err = new Error('प्रस्ताव नहीं मिला (Offer not found)');
      err.statusCode = 404;
      throw err;
    }

    if (offer.farmer_id !== userId && offer.buyer_id !== userId) {
      const err = new Error('अनाधिकृत अनुरोध (Unauthorized to reject this offer)');
      err.statusCode = 403;
      throw err;
    }

    if (offer.status === 'accepted' || offer.status === 'rejected') {
      const err = new Error(`प्रस्ताव पहले से ${offer.status} है (Offer is already ${offer.status})`);
      err.statusCode = 400;
      throw err;
    }

    const updatedOffer = await Offer.updateStatus(offerId, 'rejected');

    await AuditLog.create({
      userId: userId,
      action: 'reject_offer',
      entityType: 'offer',
      entityId: offerId
    });

    return updatedOffer;
  }

  static async counterOffer(offerId, userId, counterPrice) {
    const offer = await Offer.findById(offerId);
    if (!offer) {
      const err = new Error('प्रस्ताव नहीं मिला (Offer not found)');
      err.statusCode = 404;
      throw err;
    }

    if (offer.farmer_id !== userId && offer.buyer_id !== userId) {
      const err = new Error('केवल संबंधित किसान या खरीदार काउंटर ऑफर दे सकता है (Only owner farmer or buyer can make a counter offer)');
      err.statusCode = 403;
      throw err;
    }

    if (offer.status !== 'pending' && offer.status !== 'countered') {
      const err = new Error('केवल लंबित या काउंटर प्रस्ताव पर काउंटर ऑफर दिया जा सकता है (Can only counter pending or countered offers)');
      err.statusCode = 400;
      throw err;
    }

    if (!counterPrice || Number(counterPrice) <= 0) {
      const err = new Error('मान्य काउंटर मूल्य दर्ज करें (Valid counter price is required)');
      err.statusCode = 400;
      throw err;
    }

    const updatedOffer = await Offer.updateStatus(offerId, 'countered', counterPrice);

    await AuditLog.create({
      userId: userId,
      action: 'counter_offer',
      entityType: 'offer',
      entityId: offerId,
      details: { original_price: offer.offered_price, counter_price: counterPrice }
    });

    return updatedOffer;
  }
}

module.exports = OfferService;
