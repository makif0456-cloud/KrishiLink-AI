import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { TradingService } from '../../services/tradingService';
import CommoditySelector from '../common/CommoditySelector';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, MapPin, Scale, Sparkles, AlertTriangle, Camera, Upload, Trash2, RefreshCw, Image as ImageIcon, X, SwitchCamera } from 'lucide-react';

export default function LotCreationWizard({ commodities = [] }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [commodityId, setCommodityId] = useState(commodities[0]?.id || 'b0000000-0000-0000-0000-000000000001');
  const [quantity, setQuantity] = useState('100');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [expectedPrice, setExpectedPrice] = useState('2500');
  const [village, setVillage] = useState(user?.village || 'बैरसिया');
  const [district, setDistrict] = useState(user?.district || 'भोपाल');
  const [state, setState] = useState(user?.state || 'Madhya Pradesh');
  const [notes, setNotes] = useState('ताजा सूखा और साफ दाना (Clean & dry harvested produce)');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);

  // Crop Photo State & Refs
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cropImageUrl, setCropImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Live Camera Viewfinder State & Refs
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // Prefer rear camera on mobile
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Safely stop all active media stream tracks and clear video source
  const stopMediaStream = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.warn('Error stopping stream track:', err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Request camera access using browser getUserMedia API
  const startCamera = useCallback(async (mode = 'environment') => {
    setCameraError(null);
    setCameraLoading(true);
    stopMediaStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        lang === 'hi'
          ? 'इस डिवाइस पर कैमरा उपलब्ध नहीं है। आप फोटो अपलोड कर सकते हैं।'
          : 'Camera is not available on this device. You can upload a photo instead.'
      );
      setCameraLoading(false);
      return;
    }

    try {
      let stream;
      try {
        // Prefer rear camera ('environment') with high quality constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (idealErr) {
        console.warn('Falling back to default video device:', idealErr);
        // Fallback to any available video camera (desktop webcam, etc.)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play warning:', playErr);
        }
      }
    } catch (err) {
      console.error('Camera acquisition error:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.name === 'SecurityError'
      ) {
        setCameraError(
          lang === 'hi'
            ? 'कैमरा अनुमति नहीं मिली। कृपया कैमरा permission allow करें।'
            : 'Camera permission was denied. Please allow camera access and try again.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(
          lang === 'hi'
            ? 'इस डिवाइस पर कैमरा उपलब्ध नहीं है। आप फोटो अपलोड कर सकते हैं।'
            : 'No camera device found on this device. You can upload a photo instead.'
        );
      } else {
        setCameraError(
          lang === 'hi'
            ? 'कैमरा शुरू करने में समस्या आई। आप फोटो अपलोड कर सकते हैं।'
            : 'Failed to access camera. You can upload a photo instead.'
        );
      }
    } finally {
      setCameraLoading(false);
    }
  }, [lang, stopMediaStream]);

  const handleOpenLiveCamera = () => {
    setError(null);
    setCapturedSnapshot(null);
    setCameraError(null);
    setCameraModalOpen(true);
  };

  const handleCloseLiveCamera = useCallback(() => {
    if (capturedSnapshot?.url) {
      URL.revokeObjectURL(capturedSnapshot.url);
    }
    setCapturedSnapshot(null);
    stopMediaStream();
    setCameraModalOpen(false);
    setCameraError(null);
  }, [capturedSnapshot, stopMediaStream]);

  // Launch camera once modal opens and video ref is active
  useEffect(() => {
    if (cameraModalOpen && !capturedSnapshot) {
      startCamera(facingMode);
    }
  }, [cameraModalOpen, facingMode, startCamera, capturedSnapshot]);

  // Clean up media tracks and object URLs on component unmount
  useEffect(() => {
    return () => {
      stopMediaStream();
      if (capturedSnapshot?.url) {
        URL.revokeObjectURL(capturedSnapshot.url);
      }
    };
  }, [stopMediaStream, capturedSnapshot]);

  // Capture current video frame onto a canvas and create a File
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        // Size check (ensure <= 5 MB)
        if (blob.size > 5 * 1024 * 1024) {
          canvas.toBlob(
            (compressedBlob) => {
              const file = new File(
                [compressedBlob || blob],
                `crop-camera-${Date.now()}.jpg`,
                { type: 'image/jpeg' }
              );
              const previewUrl = URL.createObjectURL(compressedBlob || blob);
              setCapturedSnapshot({ file, url: previewUrl });
              stopMediaStream();
            },
            'image/jpeg',
            0.75
          );
          return;
        }

        const file = new File(
          [blob],
          `crop-camera-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        const previewUrl = URL.createObjectURL(blob);
        setCapturedSnapshot({ file, url: previewUrl });
        stopMediaStream();
      },
      'image/jpeg',
      0.88
    );
  };

  const handleRetakeSnapshot = () => {
    if (capturedSnapshot?.url) {
      URL.revokeObjectURL(capturedSnapshot.url);
    }
    setCapturedSnapshot(null);
    startCamera(facingMode);
  };

  const handleConfirmUsePhoto = () => {
    if (!capturedSnapshot) return;

    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(capturedSnapshot.file);
    setPhotoPreview(capturedSnapshot.url);
    setCropImageUrl(null);

    setCapturedSnapshot(null);
    stopMediaStream();
    setCameraModalOpen(false);
  };

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  const handleCameraFallbackUpload = () => {
    handleCloseLiveCamera();
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 120);
  };

  const selectedCrop = (commodities || []).find(c => c.id === commodityId) || commodities[0] || { name_hi: 'गेहूं', name_en: 'Wheat', icon: '🌾' };

  const handlePhotoSelect = (e) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Allowed types: JPG/JPEG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError(t('err_invalid_image_type') || 'कृपया JPG, PNG या WEBP फोटो अपलोड करें।');
      e.target.value = '';
      return;
    }

    // Max file size: 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(t('err_image_too_large') || 'फोटो का आकार 5 MB से कम होना चाहिए।');
      e.target.value = '';
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setCropImageUrl(null);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setCropImageUrl(null);
  };

  const handleNext = () => {
    setError(null);
    if (step === 2 && (!quantity || Number(quantity) <= 0)) {
      setError('कृपया मान्य मात्रा दर्ज करें (Please enter a valid quantity)');
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      let finalImageUrl = cropImageUrl;

      // If a local photo file is chosen but not yet uploaded, upload it now
      if (photoFile && !finalImageUrl) {
        setUploadingPhoto(true);
        const uploadResult = await TradingService.uploadLotPhoto(photoFile);
        finalImageUrl = uploadResult.image_url;
        setCropImageUrl(finalImageUrl);
      }

      const createdLot = await TradingService.createLot({
        commodity_id: commodityId,
        quantity: Number(quantity),
        unit: 'quintal',
        quality_grade: qualityGrade,
        expected_price: expectedPrice ? Number(expectedPrice) : null,
        crop_image_url: finalImageUrl || undefined,
        photos: finalImageUrl ? [finalImageUrl] : [],
        latitude: district.includes('भोपाल') ? 23.6341 : 26.8467,
        longitude: district.includes('भोपाल') ? 77.4338 : 80.9462,
        notes
      });
      navigate(`/my-lots/${createdLot.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('error_occurred'));
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Step Progress Bar */}
      <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-2.5 transition-colors">
        <div className="flex items-center justify-between text-xs font-black text-gray-700 dark:text-gray-200">
          <span>{t('wizard_title')}</span>
          <span className="bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 px-2.5 py-0.5 rounded-full font-mono border border-krishi-200 dark:border-krishi-800">
            स्टेप {step} / 5
          </span>
        </div>
        
        {/* Visual Progress Line */}
        <div className="w-full bg-gray-100 dark:bg-darkbg-card h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-krishi-600 to-krishi-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>

        {/* Step indicators */}
        <div className="grid grid-cols-5 text-center text-[10px] font-bold text-gray-400 dark:text-darkbg-muted pt-1">
          <span className={step >= 1 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>1. फसल</span>
          <span className={step >= 2 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>2. मात्रा</span>
          <span className={step >= 3 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>3. गुणवत्ता</span>
          <span className={step >= 4 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>4. जगह</span>
          <span className={step >= 5 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>5. पुष्टि</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs p-4 rounded-2xl border border-red-200 dark:border-red-800 font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Wizard Body Card */}
      <div className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-md space-y-5 min-h-[380px] flex flex-col justify-between transition-colors">
        {/* STEP 1: SELECT COMMODITY */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                1. {t('step1_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step1_desc')}</p>
            </div>

            <CommoditySelector
              commodities={commodities}
              selectedId={commodityId}
              onSelect={(id) => setCommodityId(id)}
            />
          </div>
        )}

        {/* STEP 2: QUANTITY & PRICE */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                2. {t('step2_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step2_desc')}</p>
            </div>

            {/* Selected Crop Pill */}
            <div className="flex items-center space-x-2.5 bg-krishi-50 dark:bg-darkbg-card border border-krishi-200 dark:border-darkbg-border p-3 rounded-2xl">
              <span className="text-2xl">{selectedCrop.icon || '🌾'}</span>
              <div>
                <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-bold block">चुनी गई फसल:</span>
                <span className="text-sm font-black text-krishi-900 dark:text-white">
                  {lang === 'hi' ? selectedCrop.name_hi : selectedCrop.name_en}
                </span>
              </div>
            </div>

            {/* Large Quantity Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                मात्रा दर्ज करें (Quintals) *
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-2xl text-2xl font-black text-gray-950 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
                />
                <span className="bg-gray-100 dark:bg-darkbg-card text-gray-800 dark:text-gray-200 font-extrabold text-sm px-4 py-4 rounded-2xl border border-gray-200 dark:border-darkbg-border shrink-0">
                  क्विंटल
                </span>
              </div>
            </div>

            {/* Expected Price Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                अपेक्षित भाव (₹/क्विंटल) — वैकल्पिक
              </label>
              <input
                type="number"
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
                placeholder="2500"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-2xl text-base font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
              />
            </div>
          </div>
        )}

        {/* STEP 3: QUALITY GRADE */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                3. {t('step3_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step3_desc')}</p>
            </div>

            {/* Quality Cards */}
            <div className="space-y-2.5">
              {[
                { id: 'A', title: t('grade_a_title'), desc: t('grade_a_desc'), stars: '⭐⭐⭐' },
                { id: 'B', title: t('grade_b_title'), desc: t('grade_b_desc'), stars: '⭐⭐' },
                { id: 'C', title: t('grade_c_title'), desc: t('grade_c_desc'), stars: '⭐' }
              ].map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setQualityGrade(g.id)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition touch-btn active:scale-98 ${
                    qualityGrade === g.id
                      ? 'bg-krishi-50 dark:bg-darkbg-card border-krishi-600 dark:border-krishi-400 shadow-sm ring-1 ring-krishi-400/40'
                      : 'bg-white dark:bg-darkbg-surface border-gray-200 dark:border-darkbg-border hover:bg-gray-50 dark:hover:bg-darkbg-card'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-gray-900 dark:text-white">{g.title}</span>
                      <span className="text-xs">{g.stars}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{g.desc}</p>
                  </div>
                  {qualityGrade === g.id && (
                    <CheckCircle2 className="w-6 h-6 text-krishi-600 dark:text-kisan-gold shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* 📷 Crop Quality Photo Capture & Upload Section */}
            <div className="pt-3.5 border-t border-gray-200 dark:border-darkbg-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-krishi-600 dark:text-kisan-gold" />
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      {t('add_crop_photo')}
                    </h4>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
                    {t('crop_photo_hint')}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-krishi-700 dark:text-kisan-gold bg-krishi-50 dark:bg-darkbg-card px-2.5 py-0.5 rounded-full border border-krishi-200 dark:border-darkbg-border">
                  वैकल्पिक
                </span>
              </div>

              {/* Hidden File Input for Device Upload (Upload Photo) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />

              {!photoPreview ? (
                /* Two options: Take Photo (Live Camera) & Upload Photo (File picker) */
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleOpenLiveCamera}
                    className="p-3.5 bg-krishi-50/70 dark:bg-darkbg-card hover:bg-krishi-100/70 dark:hover:bg-darkbg-hover border border-krishi-200 dark:border-darkbg-border rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition touch-btn active:scale-98 text-krishi-900 dark:text-white group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-darkbg-surface shadow-xs flex items-center justify-center text-krishi-700 dark:text-kisan-gold group-hover:scale-105 transition">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black">{t('take_photo')}</span>
                    <span className="text-[10px] text-gray-400 dark:text-darkbg-muted">📷 कैमरा खोलें</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 bg-gray-50 dark:bg-darkbg-card hover:bg-gray-100 dark:hover:bg-darkbg-hover border border-gray-200 dark:border-darkbg-border rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition touch-btn active:scale-98 text-gray-800 dark:text-gray-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-darkbg-surface shadow-xs flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:scale-105 transition">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-black">{t('upload_photo')}</span>
                    <span className="text-[10px] text-gray-400 dark:text-darkbg-muted">📁 गैलरी / फाइल</span>
                  </button>
                </div>
              ) : (
                /* Photo Preview Box */
                <div className="bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('photo_added')}</span>
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-darkbg-muted">
                      {photoFile?.size ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                    </span>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-darkbg-border bg-black/5 aspect-video sm:aspect-2/1 flex items-center justify-center max-h-56">
                    <img
                      src={photoPreview}
                      alt={`${lang === 'hi' ? selectedCrop.name_hi : selectedCrop.name_en} crop photo`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                      Grade {qualityGrade} • {lang === 'hi' ? selectedCrop.name_hi : selectedCrop.name_en}
                    </span>
                  </div>

                  {/* Actions: Retake (re-opens camera) & Remove */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenLiveCamera}
                      className="flex-1 py-2 px-3 bg-white dark:bg-darkbg-surface hover:bg-gray-100 dark:hover:bg-darkbg-hover border border-gray-200 dark:border-darkbg-border rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center space-x-1.5 transition touch-btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('retake_photo')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="py-2 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-center space-x-1 transition touch-btn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('remove_photo')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: LOCATION */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                4. {t('step4_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step4_desc')}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">गांव / स्थान</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="बैरसिया / खन्ना / लखनऊ"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">जिला</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="भोपाल / लखनऊ"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">राज्य</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">विवरण / नोट्स (वैकल्पिक)</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & CONFIRM */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                5. {t('step5_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step5_desc')}</p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-krishi-50/80 dark:bg-darkbg-card border border-krishi-300 dark:border-darkbg-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-krishi-200 dark:border-darkbg-border">
                <div className="flex items-center space-x-2.5">
                  <span className="text-3xl">{selectedCrop.icon || '🌾'}</span>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-darkbg-muted font-bold block">फसल का नाम</span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {lang === 'hi' ? selectedCrop.name_hi : selectedCrop.name_en}
                    </span>
                  </div>
                </div>
                <span className="bg-krishi-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-xs">
                  Grade {qualityGrade}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white dark:bg-darkbg-surface p-3 rounded-xl border border-gray-200 dark:border-darkbg-border">
                  <span className="text-gray-500 dark:text-darkbg-muted font-bold block">कुल मात्रा</span>
                  <span className="text-base font-black text-gray-900 dark:text-white">{quantity} क्विंटल</span>
                </div>
                <div className="bg-white dark:bg-darkbg-surface p-3 rounded-xl border border-gray-200 dark:border-darkbg-border">
                  <span className="text-gray-500 dark:text-darkbg-muted font-bold block">अपेक्षित भाव</span>
                  <span className="text-base font-black text-krishi-700 dark:text-kisan-gold">₹{expectedPrice}/क्विंटल</span>
                </div>
              </div>

              <div className="bg-white dark:bg-darkbg-surface p-3 rounded-xl border border-gray-200 dark:border-darkbg-border flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-krishi-600 dark:text-kisan-gold shrink-0" />
                <span>स्थान: <strong>{village}, {district} ({state})</strong></span>
              </div>

              {/* Crop Photo Preview Thumbnail if Attached */}
              {photoPreview && (
                <div className="bg-white dark:bg-darkbg-surface p-3 rounded-xl border border-gray-200 dark:border-darkbg-border flex items-center space-x-3">
                  <img
                    src={photoPreview}
                    alt={`${lang === 'hi' ? selectedCrop.name_hi : selectedCrop.name_en} preview`}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-darkbg-border shrink-0 shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t('photo_added')}
                    </span>
                    <span className="text-xs font-black text-gray-900 dark:text-white block mt-0.5 truncate">
                      {t('crop_photo_label')} (Grade {qualityGrade})
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-darkbg-muted block truncate">
                      {t('crop_photo_disclaimer')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Controls Navigation Buttons */}
        <div className="pt-4 border-t border-gray-100 dark:border-darkbg-border flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-3 bg-gray-100 dark:bg-darkbg-card hover:bg-gray-200 dark:hover:bg-darkbg-hover text-gray-800 dark:text-gray-200 font-bold rounded-xl text-sm flex items-center space-x-1 touch-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back')}</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3.5 bg-krishi-600 hover:bg-krishi-700 active:bg-krishi-800 text-white font-black rounded-2xl text-sm flex items-center space-x-2 shadow-md touch-btn ml-auto"
            >
              <span>{t('next')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-4 bg-gradient-to-r from-krishi-600 to-krishi-700 hover:from-krishi-700 hover:to-krishi-800 active:scale-98 text-white font-black rounded-2xl text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg touch-btn w-full sm:w-auto ml-auto disabled:opacity-60 transition"
            >
              <span>{loading ? (uploadingPhoto ? (t('uploading_photo') || 'फोटो अपलोड हो रही है...') : 'दर्ज हो रहा है...') : t('submit_lot_btn')}</span>
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 📷 Live Camera Modal Overlay */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-darkbg-surface border border-gray-200 dark:border-darkbg-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-darkbg-border flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-krishi-50 dark:bg-darkbg-card text-krishi-700 dark:text-kisan-gold flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                    {t('take_crop_photo')}
                  </h3>
                  <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">
                    {lang === 'hi' ? selectedCrop.name_hi : selectedCrop.name_en} • Grade {qualityGrade}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseLiveCamera}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkbg-card hover:bg-gray-200 dark:hover:bg-darkbg-hover text-gray-700 dark:text-gray-300 flex items-center justify-center transition"
                aria-label={t('close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
              {/* Error State */}
              {cameraError ? (
                <div className="py-6 px-4 text-center space-y-4 bg-red-50/70 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-red-900 dark:text-red-200">
                      {t('camera_permission_denied')}
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium max-w-sm mx-auto">
                      {cameraError}
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border hover:bg-gray-50 dark:hover:bg-darkbg-hover rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center space-x-1.5 transition touch-btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>पुनः प्रयास करें (Retry)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCameraFallbackUpload}
                      className="w-full sm:w-auto px-5 py-2.5 bg-krishi-600 hover:bg-krishi-700 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 shadow-sm transition touch-btn"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t('upload_photo')}</span>
                    </button>
                  </div>
                </div>
              ) : capturedSnapshot ? (
                /* Captured Photo Preview State */
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-200 dark:border-darkbg-border aspect-4/3 sm:aspect-16/9 flex items-center justify-center shadow-inner">
                    <img
                      src={capturedSnapshot.url}
                      alt="Captured crop preview"
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                      Grade {qualityGrade} • {lang === 'hi' ? selectedCrop.name_hi : selectedCrop.name_en}
                    </span>
                  </div>

                  {/* Retake / Use Photo Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleRetakeSnapshot}
                      className="py-3 px-4 bg-gray-100 dark:bg-darkbg-card hover:bg-gray-200 dark:hover:bg-darkbg-hover text-gray-800 dark:text-gray-200 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition touch-btn active:scale-98"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{t('retake')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmUsePhoto}
                      className="py-3 px-4 bg-gradient-to-r from-krishi-600 to-krishi-700 hover:from-krishi-700 hover:to-krishi-800 active:scale-98 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition touch-btn"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('use_photo')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Camera Viewfinder State */
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-gray-200 dark:border-darkbg-border aspect-4/3 sm:aspect-16/9 flex items-center justify-center shadow-inner">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Target Framing Box */}
                    <div className="absolute inset-4 sm:inset-6 pointer-events-none border-2 border-white/40 border-dashed rounded-xl flex items-center justify-center">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-white absolute top-0 left-0"></div>
                      <div className="w-6 h-6 border-t-2 border-r-2 border-white absolute top-0 right-0"></div>
                      <div className="w-6 h-6 border-b-2 border-l-2 border-white absolute bottom-0 left-0"></div>
                      <div className="w-6 h-6 border-b-2 border-r-2 border-white absolute bottom-0 right-0"></div>
                    </div>

                    {/* Hint badge */}
                    <span className="absolute bottom-2.5 bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-full pointer-events-none text-center">
                      {t('camera_preview_hint')}
                    </span>

                    {cameraLoading && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-kisan-gold" />
                        <span className="text-xs font-bold">{t('camera_starting')}</span>
                      </div>
                    )}
                  </div>

                  {/* Live Camera Controls */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Cancel Button */}
                    <button
                      type="button"
                      onClick={handleCloseLiveCamera}
                      className="text-xs font-bold text-gray-500 dark:text-darkbg-muted hover:text-gray-800 dark:hover:text-white px-3 py-2 rounded-xl transition"
                    >
                      {t('close_camera')}
                    </button>

                    {/* Shutter Capture Button */}
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        disabled={cameraLoading}
                        className="w-16 h-16 rounded-full border-4 border-krishi-600 dark:border-kisan-gold flex items-center justify-center p-1 active:scale-90 transition touch-btn shadow-lg bg-white/10"
                        aria-label={t('capture_photo')}
                      >
                        <div className="w-12 h-12 rounded-full bg-krishi-600 hover:bg-krishi-700 active:bg-krishi-800 dark:bg-kisan-gold flex items-center justify-center text-white shadow-inner transition">
                          <Camera className="w-6 h-6" />
                        </div>
                      </button>
                      <span className="text-[11px] font-black text-gray-800 dark:text-gray-200 mt-1">
                        {t('capture_photo')}
                      </span>
                    </div>

                    {/* Switch Camera Button (Environment vs User) */}
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      className="flex items-center space-x-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-krishi-700 dark:hover:text-kisan-gold bg-gray-100 dark:bg-darkbg-card hover:bg-gray-200 dark:hover:bg-darkbg-hover px-3 py-2 rounded-xl transition touch-btn"
                      title={t('switch_camera')}
                    >
                      <SwitchCamera className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('switch_camera')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
