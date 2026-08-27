import React, { useState } from 'react';
import { Mic, Sparkles, Volume2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import VoiceAssistantModal from './VoiceAssistantModal';

export default function VoiceButton({ onVoiceQuery }) {
  const { t, lang } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenVoice = () => {
    setModalOpen(true);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-krishi-800 via-krishi-900 to-krishi-950 dark:from-darkbg-card dark:via-darkbg-surface dark:to-darkbg-card text-white p-4 sm:p-5 rounded-3xl shadow-lg border border-krishi-600/50 dark:border-darkbg-border relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1 pr-3">
            <div className="flex items-center space-x-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-kisan-gold animate-bounce" />
              <span className="text-[11px] font-black uppercase tracking-wider text-kisan-gold">
                AI Voice Assistant • हिंदी आवाज़
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white leading-tight">
              {t('voice_banner_title')}
            </h2>
            <p className="text-xs text-krishi-100 dark:text-darkbg-muted mt-1 line-clamp-2">
              {t('voice_banner_subtitle')}
            </p>
          </div>

          {/* Large Voice Action Button */}
          <button
            type="button"
            onClick={handleOpenVoice}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black text-gray-950 bg-gradient-to-tr from-kisan-amber to-kisan-gold hover:from-kisan-gold hover:to-amber-300 shadow-xl transition-all active:scale-95 touch-btn shrink-0 voice-pulse border-2 border-white/40 dark:border-darkbg-surface"
            title={t('voice_button_label')}
          >
            <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-gray-950" />
            <span className="text-[9px] font-black leading-none mt-0.5">
              बोलें
            </span>
          </button>
        </div>

        {/* Quick hint bar */}
        <div className="mt-3 pt-3 border-t border-krishi-700/60 dark:border-darkbg-border flex items-center justify-between text-xs text-krishi-100 dark:text-darkbg-muted">
          <span className="text-[11px] truncate">💡 "गेहूं का आज का भाव क्या है?"</span>
          <button
            type="button"
            onClick={handleOpenVoice}
            className="text-[11px] font-extrabold text-kisan-gold hover:underline shrink-0 ml-2"
          >
            सहायक खोलें →
          </button>
        </div>
      </div>

      {/* Interactive Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
