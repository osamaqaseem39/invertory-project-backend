import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/i18nContext';
import { useAuthStore } from '../store/authStore';
import brandingAPI, { BrandingProfile, CreateBrandingData } from '../api/branding';
import LogoUpload from '../components/LogoUpload';
import ColorPicker from '../components/ColorPicker';

const BrandingManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const [brandings, setBrandings] = useState<BrandingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranding, setEditingBranding] = useState<BrandingProfile | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateBrandingData>({
    company_name: '',
    company_name_ar: '',
    tagline: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    business_website: '',
    tax_id: '',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    accent_color: '#EC4899',
    success_color: '#10B981',
    warning_color: '#F59E0B',
    error_color: '#EF4444',
    font_family: 'INTER',
    theme_mode: 'LIGHT',
    receipt_header_text: '',
    receipt_footer_text: 'Thank you for your business!',
    receipt_logo_position: 'CENTER',
    invoice_template: 'modern',
    invoice_watermark: '',
    show_watermark: false,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    loadBrandings();
  }, []);

  const loadBrandings = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const data = await brandingAPI.listBrandings(token);
      setBrandings(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load brandings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!token) return;
      
      const newBranding = await brandingAPI.createBranding(token, formData);

      // Upload logo if provided
      if (logoFile) {
        setUploadingLogo(true);
        await brandingAPI.uploadLogo(token, newBranding.id, logoFile);
      }

      alert(t.branding?.brandingCreated || 'Branding profile created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadBrandings();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create branding');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!token || !editingBranding) return;

      await brandingAPI.updateBranding(token, editingBranding.id, formData);

      // Upload logo if changed
      if (logoFile) {
        setUploadingLogo(true);
        await brandingAPI.uploadLogo(token, editingBranding.id, logoFile);
      }

      alert(t.branding?.brandingUpdated || 'Branding profile updated successfully!');
      setEditingBranding(null);
      resetForm();
      loadBrandings();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update branding');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      if (!token) return;
      await brandingAPI.activateBranding(token, id);
      alert(t.branding?.brandingActivated || 'Branding activated!');
      loadBrandings();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to activate branding');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.branding?.confirmDelete || 'Are you sure you want to delete this branding profile?')) {
      return;
    }

    try {
      if (!token) return;
      await brandingAPI.deleteBranding(token, id);
      alert(t.branding?.brandingDeleted || 'Branding profile deleted!');
      loadBrandings();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete branding');
    }
  };

  const handleEdit = (branding: BrandingProfile) => {
    setEditingBranding(branding);
    setFormData({
      company_name: branding.company_name,
      company_name_ar: branding.company_name_ar || '',
      tagline: branding.tagline || '',
      business_address: branding.business_address || '',
      business_phone: branding.business_phone || '',
      business_email: branding.business_email || '',
      business_website: branding.business_website || '',
      tax_id: branding.tax_id || '',
      primary_color: branding.primary_color,
      secondary_color: branding.secondary_color,
      accent_color: branding.accent_color,
      success_color: branding.success_color,
      warning_color: branding.warning_color,
      error_color: branding.error_color,
      font_family: branding.font_family,
      theme_mode: branding.theme_mode,
      receipt_header_text: branding.receipt_header_text || '',
      receipt_footer_text: branding.receipt_footer_text || '',
      receipt_logo_position: branding.receipt_logo_position,
      invoice_template: branding.invoice_template,
      invoice_watermark: branding.invoice_watermark || '',
      show_watermark: branding.show_watermark,
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      company_name_ar: '',
      tagline: '',
      business_address: '',
      business_phone: '',
      business_email: '',
      business_website: '',
      tax_id: '',
      primary_color: '#3B82F6',
      secondary_color: '#8B5CF6',
      accent_color: '#EC4899',
      success_color: '#10B981',
      warning_color: '#F59E0B',
      error_color: '#EF4444',
      font_family: 'INTER',
      theme_mode: 'LIGHT',
      receipt_header_text: '',
      receipt_footer_text: 'Thank you for your business!',
      receipt_logo_position: 'CENTER',
      invoice_template: 'modern',
      invoice_watermark: '',
      show_watermark: false,
    });
    setLogoFile(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t.branding?.title || 'Branding Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t.branding?.subtitle || 'Customize your company branding, colors, and logos'}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingBranding(null);
            setShowCreateModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                     rounded-lg font-medium hover:shadow-lg transition-all"
        >
          {t.branding?.createNew || '+ Create Branding'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Branding List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brandings.map((branding) => (
          <div
            key={branding.id}
            className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden
                       hover:shadow-xl transition-all"
          >
            {/* Preview Header with gradient */}
            <div
              className="h-24 p-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color})`,
              }}
            >
              {branding.logo_header ? (
                <img
                  src={`http://localhost:4000${branding.logo_header}`}
                  alt={branding.company_name}
                  className="max-h-16 object-contain"
                />
              ) : (
                <div className="text-white text-2xl font-bold">
                  {branding.company_name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {branding.company_name}
                  </h3>
                  {branding.tagline && (
                    <p className="text-sm text-gray-600">{branding.tagline}</p>
                  )}
                </div>
                {branding.is_active && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    {t.branding?.active || 'Active'}
                  </span>
                )}
              </div>

              {/* Color palette */}
              <div className="flex gap-2 mb-4">
                <div
                  className="flex-1 h-8 rounded border border-gray-200"
                  style={{ backgroundColor: branding.primary_color }}
                  title={`Primary: ${branding.primary_color}`}
                />
                <div
                  className="flex-1 h-8 rounded border border-gray-200"
                  style={{ backgroundColor: branding.secondary_color }}
                  title={`Secondary: ${branding.secondary_color}`}
                />
                <div
                  className="flex-1 h-8 rounded border border-gray-200"
                  style={{ backgroundColor: branding.accent_color }}
                  title={`Accent: ${branding.accent_color}`}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(branding)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium
                             hover:bg-blue-100 transition-colors"
                >
                  {t.common?.edit || 'Edit'}
                </button>
                {!branding.is_active && (
                  <button
                    onClick={() => handleActivate(branding.id)}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium
                               hover:bg-green-100 transition-colors"
                  >
                    {t.branding?.activate || 'Activate'}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(branding.id)}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium
                             hover:bg-red-100 transition-colors"
                >
                  {t.common?.delete || 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {brandings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {t.branding?.noBrandings || 'No branding profiles yet. Create one to get started!'}
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBranding
                  ? (t.branding?.editBranding || 'Edit Branding Profile')
                  : (t.branding?.createBranding || 'Create Branding Profile')
                }
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.branding?.companyInfo || 'Company Information'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.branding?.companyName || 'Company Name'} *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.branding?.companyNameAr || 'Company Name (Arabic)'}
                    </label>
                    <input
                      type="text"
                      value={formData.company_name_ar}
                      onChange={(e) => setFormData({ ...formData, company_name_ar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      dir="rtl"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.branding?.tagline || 'Tagline'}
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.branding?.businessAddress || 'Business Address'}
                    </label>
                    <textarea
                      value={formData.business_address}
                      onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.branding?.businessPhone || 'Business Phone'}
                    </label>
                    <input
                      type="tel"
                      value={formData.business_phone}
                      onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.branding?.businessEmail || 'Business Email'}
                    </label>
                    <input
                      type="email"
                      value={formData.business_email}
                      onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.branding?.businessWebsite || 'Business Website'}
                    </label>
                    <input
                      type="url"
                      value={formData.business_website}
                      onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.branding?.taxId || 'Tax ID'}
                    </label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.branding?.logo || 'Logo'}
                </h3>
                <LogoUpload
                  onLogoSelect={(file) => setLogoFile(file)}
                  currentLogo={editingBranding?.logo_header ? `http://localhost:4000${editingBranding.logo_header}` : undefined}
                />
              </div>

              {/* Colors */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.branding?.colors || 'Brand Colors'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker
                    label={t.branding?.primaryColor || 'Primary Color'}
                    value={formData.primary_color || '#3B82F6'}
                    onChange={(color) => setFormData({ ...formData, primary_color: color })}
                  />
                  <ColorPicker
                    label={t.branding?.secondaryColor || 'Secondary Color'}
                    value={formData.secondary_color || '#8B5CF6'}
                    onChange={(color) => setFormData({ ...formData, secondary_color: color })}
                  />
                  <ColorPicker
                    label={t.branding?.accentColor || 'Accent Color'}
                    value={formData.accent_color || '#EC4899'}
                    onChange={(color) => setFormData({ ...formData, accent_color: color })}
                  />
                </div>
              </div>

              {/* Receipt Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.branding?.receiptSettings || 'Receipt Settings'}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.branding?.receiptFooter || 'Receipt Footer Text'}
                  </label>
                  <input
                    type="text"
                    value={formData.receipt_footer_text}
                    onChange={(e) => setFormData({ ...formData, receipt_footer_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingBranding(null);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium
                           hover:bg-gray-100 transition-colors"
              >
                {t.common?.cancel || 'Cancel'}
              </button>
              <button
                onClick={editingBranding ? handleUpdate : handleCreate}
                disabled={!formData.company_name || uploadingLogo}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
                           font-medium hover:shadow-lg transition-all disabled:opacity-50 
                           disabled:cursor-not-allowed"
              >
                {uploadingLogo
                  ? (t.branding?.uploading || 'Uploading...')
                  : editingBranding
                    ? (t.common?.save || 'Save Changes')
                    : (t.common?.create || 'Create')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandingManagementPage;

