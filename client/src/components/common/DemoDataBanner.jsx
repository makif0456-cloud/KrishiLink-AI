import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AlertTriangle, X } from 'lucide-react';

export default function DemoDataBanner() {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-100/90 dark:bg-amber-950/80 border-b border-amber-300/80 dark:border-amber-900/60 text-amber-950 dark:text-amber-200 px-3 py-1 text-xs font-semibold flex items-center justify-between sticky top-0 z-40 backdrop-blur-xs transition-colors">
      <div className="flex items-center space-x-1.5 max-w-full overflow-hidden">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="truncate">{t('demo_data_disclaimer')}</span>
      </div>
      <div className="flex items-center space-x-2 shrink-0 ml-2">
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-700 dark:text-amber-400 hover:text-amber-950 dark:hover:text-white p-0.5 rounded transition"
          title="Dismiss"
          aria-label="Dismiss banner"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
