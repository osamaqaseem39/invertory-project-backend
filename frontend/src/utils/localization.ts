import { Language } from '../i18n/translations';

// Utility functions for handling bilingual content

export interface LocalizedContent {
  en?: string;
  ar?: string;
}

/**
 * Get the appropriate content based on the current language
 * Falls back to English if Arabic content is not available
 */
export const getLocalizedContent = (
  content: LocalizedContent | string | null | undefined,
  language: Language
): string => {
  if (!content) return '';
  
  // If content is a string, return it as is
  if (typeof content === 'string') {
    return content;
  }
  
  // If content is an object with language keys
  if (typeof content === 'object') {
    if (language === 'ar' && content.ar) {
      return content.ar;
    }
    return content.en || '';
  }
  
  return '';
};

/**
 * Get localized product name
 */
export const getProductName = (product: { name: string; name_ar?: string }, language: Language): string => {
  if (language === 'ar' && product.name_ar) {
    return product.name_ar;
  }
  return product.name;
};

/**
 * Get localized product description
 */
export const getProductDescription = (product: { description?: string; description_ar?: string }, language: Language): string => {
  if (language === 'ar' && product.description_ar) {
    return product.description_ar;
  }
  return product.description || '';
};

/**
 * Get localized product brand
 */
export const getProductBrand = (product: { brand?: string; brand_ar?: string }, language: Language): string => {
  if (language === 'ar' && product.brand_ar) {
    return product.brand_ar;
  }
  return product.brand || '';
};

/**
 * Get localized category name
 */
export const getCategoryName = (category: { name: string; name_ar?: string }, language: Language): string => {
  if (language === 'ar' && category.name_ar) {
    return category.name_ar;
  }
  return category.name;
};

/**
 * Get localized supplier name
 */
export const getSupplierName = (supplier: { name: string; name_ar?: string }, language: Language): string => {
  if (language === 'ar' && supplier.name_ar) {
    return supplier.name_ar;
  }
  return supplier.name;
};

/**
 * Get localized customer name
 */
export const getCustomerName = (customer: { first_name: string; last_name: string; first_name_ar?: string; last_name_ar?: string }, language: Language): string => {
  if (language === 'ar' && customer.first_name_ar && customer.last_name_ar) {
    return `${customer.first_name_ar} ${customer.last_name_ar}`;
  }
  return `${customer.first_name} ${customer.last_name}`;
};

/**
 * Get localized company name
 */
export const getCompanyName = (entity: { company_name?: string; company_name_ar?: string }, language: Language): string => {
  if (language === 'ar' && entity.company_name_ar) {
    return entity.company_name_ar;
  }
  return entity.company_name || '';
};

/**
 * Format currency with proper locale
 */
export const formatCurrency = (amount: number, language: Language, currency: string = 'USD'): string => {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format number with proper locale
 */
export const formatNumber = (num: number, language: Language): string => {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US').format(num);
};

/**
 * Format date with proper locale
 */
export const formatDate = (date: Date | string, language: Language): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Format date and time with proper locale
 */
export const formatDateTime = (date: Date | string, language: Language): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};
