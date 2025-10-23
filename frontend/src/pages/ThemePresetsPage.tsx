import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/i18nContext';
import { useAuthStore } from '../store/authStore';
import brandingAPI, { ThemePreset, BrandingProfile } from '../api/branding';

const ThemePresetsPage: React.FC = () => {
  const { t } = useTranslation();
  const token = localStorage.getItem('access_token');

  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [brandings, setBrandings] = useState<BrandingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrandingId, setSelectedBrandingId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load presets (public)
      const presetsData = await brandingAPI.getThemePresets();
      setPresets(presetsData);

      // Load brandings (admin only)
      if (token) {
        const brandingsData = await brandingAPI.listBrandings(token);
        setBrandings(brandingsData);
        
        // Auto-select active branding
        const activeBranding = brandingsData.find((b: BrandingProfile) => b.is_active);
        if (activeBranding) {
          setSelectedBrandingId(activeBranding.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load presets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = async (presetId: string) => {
    if (!selectedBrandingId) {
      alert(t.branding?.selectBrandingFirst || 'Please select a branding profile first');
      return;
    }

    if (!confirm(t.branding?.confirmApplyPreset || 'Apply this theme to your branding?')) {
      return;
    }

    try {
      if (!token) return;
      
      await brandingAPI.applyThemePreset(token, selectedBrandingId, presetId);
      alert(t.branding?.themeApplied || 'Theme applied successfully!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to apply theme');
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.branding?.themePresets || 'Theme Presets'}
        </h1>
        <p className="text-gray-600 mt-1">
          {t.branding?.presetsSubtitle || 'Choose from pre-made color themes or create your own'}
        </p>
      </div>

      {/* Branding Selector (for admins) */}
      {brandings.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-md p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.branding?.selectBranding || 'Select branding profile to apply theme:'}
          </label>
          <select
            value={selectedBrandingId}
            onChange={(e) => setSelectedBrandingId(e.target.value)}
            className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.branding?.chooseBranding || 'Choose branding profile...'}</option>
            {brandings.map((branding) => (
              <option key={branding.id} value={branding.id}>
                {branding.company_name} {branding.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden
                       hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
          >
            {/* Color Preview */}
            <div className="h-32 relative">
              {/* Gradient background */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${preset.primary_color}, ${preset.secondary_color})`,
                }}
              />
              
              {/* Color circles overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-2">
                <div
                  className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                  style={{ backgroundColor: preset.primary_color }}
                />
                <div
                  className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                  style={{ backgroundColor: preset.secondary_color }}
                />
                <div
                  className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
                  style={{ backgroundColor: preset.accent_color }}
                />
              </div>

              {/* Built-in badge */}
              {preset.is_builtin && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-white bg-opacity-90 text-blue-700 text-xs font-medium rounded">
                    {t.branding?.builtin || 'Built-in'}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {preset.name}
              </h3>
              {preset.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {preset.description}
                </p>
              )}

              {/* Color codes */}
              <div className="space-y-1 mb-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: preset.primary_color }}
                  />
                  <span className="text-gray-600">{preset.primary_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: preset.secondary_color }}
                  />
                  <span className="text-gray-600">{preset.secondary_color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: preset.accent_color }}
                  />
                  <span className="text-gray-600">{preset.accent_color}</span>
                </div>
              </div>

              {/* Usage count */}
              {preset.usage_count > 0 && (
                <p className="text-xs text-gray-500 mb-3">
                  {t.branding?.usedTimes || 'Used'} {preset.usage_count} {t.branding?.times || 'times'}
                </p>
              )}

              {/* Apply button */}
              {token && (
                <button
                  onClick={() => handleApplyPreset(preset.id)}
                  disabled={!selectedBrandingId}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 
                             text-white rounded-lg font-medium hover:shadow-lg transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.branding?.applyTheme || 'Apply Theme'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {presets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {t.branding?.noPresets || 'No theme presets available'}
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          {t.branding?.howItWorks || 'How it works'}
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>{t.branding?.howStep1 || 'Select a branding profile from the dropdown above'}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>{t.branding?.howStep2 || 'Click "Apply Theme" on any preset to update colors'}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>{t.branding?.howStep3 || 'Your branding colors will be updated instantly'}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>{t.branding?.howStep4 || 'You can always customize colors further in Branding Management'}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ThemePresetsPage;

