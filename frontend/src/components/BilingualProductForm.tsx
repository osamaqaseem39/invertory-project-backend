import React, { useState } from 'react';
import { useTranslation } from '../i18n/i18nContext';
import { RTLWrapper, RTLFlex } from './RTLComponents';
import { formatCurrency } from '../utils/localization';

interface ProductFormData {
  // English fields
  name: string;
  description: string;
  brand: string;
  // Arabic fields
  name_ar: string;
  description_ar: string;
  brand_ar: string;
  // Other fields
  sku: string;
  price: number;
  cost: number;
  stock_quantity: number;
}

interface BilingualProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
  isLoading?: boolean;
}

export const BilingualProductForm: React.FC<BilingualProductFormProps> = ({
  onSubmit,
  initialData = {},
  isLoading = false
}) => {
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    brand: '',
    name_ar: '',
    description_ar: '',
    brand_ar: '',
    sku: '',
    price: 0,
    cost: 0,
    stock_quantity: 0,
    ...initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <RTLWrapper className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-2">
            {t.products.addProduct}
          </h2>
          <p className="text-slate-600">
            {language === 'ar' 
              ? 'أدخل تفاصيل المنتج باللغتين الإنجليزية والعربية'
              : 'Enter product details in both English and Arabic'
            }
          </p>
        </div>

        {/* Product Information Section */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-800">
            Product Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.products.sku} *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                className="input-field"
                required
                placeholder="PROD-001"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.products.price} *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                className="input-field"
                required
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">
                {formatCurrency(formData.price, language)}
              </p>
            </div>
          </div>
        </div>

        {/* Bilingual Content Section */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-800">
            {language === 'ar' ? 'المحتوى ثنائي اللغة' : 'Bilingual Content'}
          </h3>
          
          {/* Product Name */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3 text-slate-700">
              {t.products.name}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  English *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field"
                  required
                  placeholder="Product Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  العربية
                </label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => handleInputChange('name_ar', e.target.value)}
                  className="input-field"
                  placeholder="اسم المنتج"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3 text-slate-700">
              Description
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  English
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="input-field h-24 resize-none"
                  placeholder="Product description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  العربية
                </label>
                <textarea
                  value={formData.description_ar}
                  onChange={(e) => handleInputChange('description_ar', e.target.value)}
                  className="input-field h-24 resize-none"
                  placeholder="وصف المنتج..."
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Product Brand */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3 text-slate-700">
              {t.products.brand}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  English
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="input-field"
                  placeholder="Brand Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  العربية
                </label>
                <input
                  type="text"
                  value={formData.brand_ar}
                  onChange={(e) => handleInputChange('brand_ar', e.target.value)}
                  className="input-field"
                  placeholder="اسم العلامة التجارية"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Information */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-800">
            {t.inventory.inventory}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.products.cost}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                className="input-field"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.inventory.stockQuantity}
              </label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <RTLFlex className="justify-end gap-4">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setFormData({
              name: '',
              description: '',
              brand: '',
              name_ar: '',
              description_ar: '',
              brand_ar: '',
              sku: '',
              price: 0,
              cost: 0,
              stock_quantity: 0
            })}
          >
            {t.common.clear}
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? t.common.loading : t.common.create}
          </button>
        </RTLFlex>
      </form>
    </RTLWrapper>
  );
};
