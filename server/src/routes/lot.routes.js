const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { successResponse } = require('../utils/responseHelper');
const LotService = require('../services/lotService');
const BuyerMatchingService = require('../services/buyerMatchingService');

// Multer Storage Configuration for Crop Photographs
const uploadDir = path.join(__dirname, '../../uploads/lots');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `crop-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
    cb(null, uniqueSuffix);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('कृपया JPG, PNG या WEBP फोटो अपलोड करें (Only JPG, PNG, and WEBP images allowed)');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter
});

// POST /api/v1/lots/upload (Farmer / FPO uploads crop photo)
router.post(
  '/upload',
  authMiddleware,
  rbac('farmer', 'fpo', 'admin'),
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'फोटो का आकार 5 MB से कम होना चाहिए (Photo size must be under 5 MB)'
          });
        }
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(err.statusCode || 400).json({ success: false, message: err.message });
      }
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'कृपया फोटो फाइल संलग्न करें (Please attach a photo file)'
        });
      }
      const image_url = `/uploads/lots/${req.file.filename}`;
      return successResponse(res, {
        image_url,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }, 'फोटो सफलतापूर्वक अपलोड हो गई (Crop photo uploaded successfully)', 201);
    });
  }
);

// POST /api/v1/lots (Farmer / FPO creates lot)
router.post(
  '/',
  authMiddleware,
  rbac('farmer', 'fpo', 'admin'),
  [
    body('commodity_id').notEmpty().withMessage('फसल आईडी आवश्यक है (commodity_id required)'),
    body('quantity').isFloat({ min: 0.1 }).withMessage('मात्रा 0 से अधिक होनी चाहिए (Quantity must be > 0)'),
    body('quality_grade').optional().isIn(['A', 'B', 'C']).withMessage('अमान्य गुणवत्ता (Invalid grade)'),
    body('crop_image_url').optional({ nullable: true, checkFalsy: true }).isString().withMessage('अमान्य फोटो लिंक (Invalid crop_image_url)'),
    body('photos').optional({ nullable: true, checkFalsy: true }).isArray().withMessage('फोटो सूची ऐरे होनी चाहिए (photos must be an array)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const lot = await LotService.createLot(req.user.id, req.body);
      return successResponse(res, { lot }, 'फसल सफलतापूर्वक दर्ज की गई (Lot created successfully)', 201);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/lots/my (Farmer views own lots)
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const lots = await LotService.getFarmerLots(req.user.id);
    return successResponse(res, { lots }, 'मेरी फसलें (My lots fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lots (Browse all active lots)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { commodity_id, status } = req.query;
    const lots = await LotService.getAllActiveLots({ commodityId: commodity_id, status });
    return successResponse(res, { lots }, 'सक्रिय फसलें (Active lots fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lots/:id (Get lot detail)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const lot = await LotService.getLotDetail(req.params.id, req.user.id, req.user.role);
    return successResponse(res, { lot }, 'फसल विवरण (Lot details fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lots/:id/matching-buyers (Deterministic buyer matching for a lot)
router.get('/:id/matching-buyers', authMiddleware, async (req, res, next) => {
  try {
    const lot = await LotService.getLotDetail(req.params.id, req.user.id, req.user.role);
    const matchingBuyers = await BuyerMatchingService.matchBuyersForLot(lot);
    return successResponse(res, { matching_buyers: matchingBuyers, total_matches: matchingBuyers.length }, 'सत्यापित खरीदार मिलान (Matched buyers fetched)');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/lots/:id (Cancel lot)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const lot = await LotService.deleteLot(req.params.id, req.user.id);
    return successResponse(res, { lot }, 'फसल हटा दी गई (Lot cancelled)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
