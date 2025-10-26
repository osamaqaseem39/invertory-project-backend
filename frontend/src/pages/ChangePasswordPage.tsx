import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { authAPI } from '../api/auth';
import { useTranslation } from '../i18n/i18nContext';

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 10) {
      setError('Password must be at least 10 characters');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.changePassword(formData.currentPassword, formData.newPassword);
      alert('✅ Password changed successfully! You will be logged out.');
      
      // Logout user
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: '', color: '' };
    if (password.length < 10) return { strength: 'Too Short', color: 'text-red-600' };
    
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    if (score <= 2) return { strength: 'Weak', color: 'text-orange-600' };
    if (score <= 3) return { strength: 'Medium', color: 'text-yellow-600' };
    if (score <= 4) return { strength: 'Strong', color: 'text-green-600' };
    return { strength: 'Very Strong', color: 'text-green-700' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down">
          <h1 className="text-3xl font-bold gradient-text mb-2">{t.nav.changePassword}</h1>
          <p className="text-slate-600 text-sm">{t.auth.password}</p>
        </div>

        {/* Form */}
        <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t.auth.currentPassword} *
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                required
                className="input-field"
                placeholder={language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter your current password'}
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t.auth.newPassword} *
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
                className="input-field"
                placeholder={language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password'}
              />
              {formData.newPassword && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-600">Strength:</span>
                  <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                    {passwordStrength.strength}
                  </span>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500 glass rounded-lg p-2 inline-block">
                💡 Min 10 characters with uppercase, lowercase, and digit/symbol
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t.auth.confirmPassword} *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="input-field"
                placeholder={language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm your new password'}
              />
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="mt-2 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="glass rounded-xl p-4 bg-blue-50/50 border border-blue-200">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Security Notice:</p>
                  <p>Changing your password will log you out of all devices. You'll need to login again with your new password.</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-bounce-in">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading || formData.newPassword !== formData.confirmPassword}
                className={`btn-primary flex-1 ${(isLoading || formData.newPassword !== formData.confirmPassword) ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {language === 'ar' ? 'جاري تغيير كلمة المرور...' : 'Changing Password...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {t.nav.changePassword}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-secondary px-8"
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};





