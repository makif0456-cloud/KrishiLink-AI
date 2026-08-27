module.exports = {
  ROLES: {
    FARMER: 'farmer',
    BUYER: 'buyer',
    FPO: 'fpo',
    ADMIN: 'admin'
  },
  COMMODITY_CATEGORIES: {
    GRAIN: 'grain',
    OILSEED: 'oilseed',
    PULSE: 'pulse',
    VEGETABLE: 'vegetable',
    FRUIT: 'fruit',
    SPICE: 'spice',
    CASH_CROP: 'cash_crop'
  },
  QUALITY_GRADES: ['A', 'B', 'C', 'any'],
  DEFAULT_WEIGHTS: {
    price: 0.40,
    distance: 0.20,
    quantity_match: 0.15,
    quality_match: 0.10,
    payment_reliability: 0.10,
    delivery_compatibility: 0.05
  },
  DEMO_DISCLAIMER_HI: "⚠️ प्रदर्शन डेटा — Demo Data: यह वास्तविक सरकारी डेटा नहीं है",
  DEMO_DISCLAIMER_EN: "⚠️ Demonstration Data: This is simulated data for prototype testing"
};
