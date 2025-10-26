import React from 'react';
import { useTranslation } from '../i18n/i18nContext';
import { RTLWrapper, RTLFlex } from './RTLComponents';
import { getProductName, formatCurrency, formatNumber, formatDate } from '../utils/localization';

// Sample product data with Arabic content
const sampleProduct = {
  id: '1',
  name: 'Laptop Computer',
  name_ar: 'جهاز كمبيوتر محمول',
  description: 'High-performance laptop for business use',
  description_ar: 'جهاز كمبيوتر محمول عالي الأداء للاستخدام التجاري',
  brand: 'TechCorp',
  brand_ar: 'تيك كورب',
  price: 1299.99,
  stock_quantity: 25,
  sku: 'LAP-001',
  created_at: new Date().toISOString()
};

export const ArabicLanguageDemo: React.FC = () => {
  const { language, setLanguage, dir } = useTranslation();

  return (
    <RTLWrapper className="max-w-4xl mx-auto p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            {language === 'ar' ? 'دعم اللغة العربية' : 'Arabic Language Support'}
          </h1>
          <p className="text-slate-600 text-lg">
            {language === 'ar' 
              ? 'عرض شامل لدعم اللغة العربية في نظام إدارة المخزون'
              : 'Comprehensive demonstration of Arabic language support in the inventory management system'
            }
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">
              {language === 'ar' ? 'تبديل اللغة' : 'Language Switcher'}
            </h3>
            <RTLFlex className="gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'ar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                العربية
              </button>
            </RTLFlex>
          </div>
        </div>

        {/* Current Language Info */}
        <div className="glass rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-semibold mb-2">
            {language === 'ar' ? 'اللغة الحالية' : 'Current Language'}
          </h2>
          <p className="text-lg">
            <span className="font-medium">
              {language === 'ar' ? 'العربية' : 'English'}
            </span>
            {' '}
            {language === 'ar' ? '(من اليمين إلى اليسار)' : '(Left to Right)'}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Direction: <code className="bg-slate-100 px-2 py-1 rounded">{dir}</code>
          </p>
        </div>

        {/* Product Display Demo */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            {language === 'ar' ? 'عرض المنتج' : 'Product Display'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Card */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-2 text-slate-800">
                {getProductName(sampleProduct, language)}
              </h3>
              <p className="text-sm text-slate-500 mb-3">
                SKU: {sampleProduct.sku}
              </p>
              <p className="text-slate-600 mb-4">
                {language === 'ar' ? sampleProduct.description_ar : sampleProduct.description}
              </p>
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(sampleProduct.price, language)}
                </span>
                <span className="text-sm text-slate-500">
                  {language === 'ar' ? 'الكمية:' : 'Stock:'} {formatNumber(sampleProduct.stock_quantity, language)}
                </span>
              </div>
              
              {sampleProduct.brand && (
                <div className="mt-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                    {language === 'ar' ? sampleProduct.brand_ar : sampleProduct.brand}
                  </span>
                </div>
              )}
            </div>

            {/* Translation Comparison */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-slate-800">
                {language === 'ar' ? 'مقارنة الترجمة' : 'Translation Comparison'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">
                    {language === 'ar' ? 'الاسم' : 'Name'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">English:</span>
                      <p className="font-medium">{sampleProduct.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">العربية:</span>
                      <p className="font-medium" dir="rtl">{sampleProduct.name_ar}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">English:</span>
                      <p className="font-medium">{sampleProduct.description}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">العربية:</span>
                      <p className="font-medium" dir="rtl">{sampleProduct.description_ar}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">
                    {language === 'ar' ? 'العلامة التجارية' : 'Brand'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">English:</span>
                      <p className="font-medium">{sampleProduct.brand}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">العربية:</span>
                      <p className="font-medium" dir="rtl">{sampleProduct.brand_ar}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Locale Formatting Demo */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            {language === 'ar' ? 'تنسيق الأرقام والتواريخ' : 'Number & Date Formatting'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <h3 className="font-semibold mb-2">
                {language === 'ar' ? 'العملة' : 'Currency'}
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(sampleProduct.price, language)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'ar' ? 'السعر' : 'Price'}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <h3 className="font-semibold mb-2">
                {language === 'ar' ? 'الرقم' : 'Number'}
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(sampleProduct.stock_quantity, language)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'ar' ? 'الكمية' : 'Quantity'}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-lg text-center">
              <h3 className="font-semibold mb-2">
                {language === 'ar' ? 'التاريخ' : 'Date'}
              </h3>
              <p className="text-lg font-bold text-purple-600">
                {formatDate(sampleProduct.created_at, language)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'ar' ? 'تاريخ الإنشاء' : 'Created Date'}
              </p>
            </div>
          </div>
        </div>

        {/* RTL Layout Demo */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            {language === 'ar' ? 'تخطيط من اليمين إلى اليسار' : 'RTL Layout Demo'}
          </h2>
          
          <RTLFlex className="justify-between items-center bg-white rounded-xl p-4 shadow-lg">
            <div className="text-left">
              <h3 className="font-semibold">
                {language === 'ar' ? 'المحتوى الأيسر' : 'Left Content'}
              </h3>
              <p className="text-sm text-slate-600">
                {language === 'ar' 
                  ? 'هذا المحتوى يظهر على اليسار في الإنجليزية وعلى اليمين في العربية'
                  : 'This content appears on the left in English and right in Arabic'
                }
              </p>
            </div>
            
            <div className="w-px h-16 bg-slate-300"></div>
            
            <div className="text-right">
              <h3 className="font-semibold">
                {language === 'ar' ? 'المحتوى الأيمن' : 'Right Content'}
              </h3>
              <p className="text-sm text-slate-600">
                {language === 'ar' 
                  ? 'هذا المحتوى يظهر على اليمين في الإنجليزية وعلى اليسار في العربية'
                  : 'This content appears on the right in English and left in Arabic'
                }
              </p>
            </div>
          </RTLFlex>
        </div>

        {/* Features List */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            {language === 'ar' ? 'الميزات المطبقة' : 'Implemented Features'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">
                ✅ {language === 'ar' ? 'مكتمل' : 'Completed'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• {language === 'ar' ? 'ترجمة كاملة للواجهة' : 'Complete UI translations'}</li>
                <li>• {language === 'ar' ? 'دعم اتجاه النص من اليمين إلى اليسار' : 'RTL text direction support'}</li>
                <li>• {language === 'ar' ? 'حقول قاعدة البيانات العربية' : 'Arabic database fields'}</li>
                <li>• {language === 'ar' ? 'تنسيق الأرقام والعملات' : 'Number and currency formatting'}</li>
                <li>• {language === 'ar' ? 'مكونات تخطيط متجاوبة' : 'Responsive layout components'}</li>
                <li>• {language === 'ar' ? 'تبديل اللغة التلقائي' : 'Automatic language switching'}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-600">
                🔄 {language === 'ar' ? 'قيد التطوير' : 'In Development'}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• {language === 'ar' ? 'مسح OCR باللغة العربية' : 'Arabic OCR scanning'}</li>
                <li>• {language === 'ar' ? 'قوالب الإيصالات العربية' : 'Arabic receipt templates'}</li>
                <li>• {language === 'ar' ? 'إشعارات البريد الإلكتروني العربية' : 'Arabic email notifications'}</li>
                <li>• {language === 'ar' ? 'البحث النصي العربي' : 'Arabic text search'}</li>
                <li>• {language === 'ar' ? 'الترتيب العربي' : 'Arabic sorting'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RTLWrapper>
  );
};
