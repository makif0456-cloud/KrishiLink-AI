import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Home } from 'lucide-react';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <span className="text-5xl">🌾</span>
      <h2 className="text-2xl font-extrabold text-gray-900">404 — पृष्ठ नहीं मिला</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        यह पेज उपलब्ध नहीं है या निर्माणाधीन है।
      </p>
      <Link
        to="/"
        className="bg-krishi-600 hover:bg-krishi-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center space-x-1.5 shadow"
      >
        <Home className="w-4 h-4" />
        <span>{t('home')} पर लौटें</span>
      </Link>
    </div>
  );
}
