import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import { usersAPI } from '../api/users';

export const CreateUserPage = () => {
  const navigate = useNavigate();
  const { permissions } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    display_name: '',
    password: '',
    role: '' as UserRole | '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.role) {
      setError('Please select a role');
      return;
    }

    setIsLoading(true);

    try {
      await usersAPI.create({
        username: formData.username,
        email: formData.email,
        display_name: formData.display_name,
        password: formData.password,
        role: formData.role,
      });

      navigate('/users');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const allowedRoles = permissions?.allowed_creation_roles || [];

  const getRoleColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      [UserRole.OWNER_ULTIMATE_SUPER_ADMIN]: 'from-purple-500 to-pink-500',
      [UserRole.ADMIN]: 'from-blue-500 to-cyan-500',
      [UserRole.CASHIER]: 'from-green-500 to-emerald-500',
      [UserRole.INVENTORY_MANAGER]: 'from-orange-500 to-amber-500',
      [UserRole.GUEST]: 'from-slate-500 to-gray-500',
      [UserRole.MASTER_ADMIN]: 'from-red-500 to-rose-500',
    };
    return colors[role] || 'from-slate-500 to-gray-500';
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down">
          <h1 className="text-3xl font-bold gradient-text mb-2">Create New User</h1>
          <p className="text-slate-600 text-sm">Add a new user to the system</p>
        </div>

        {/* Form */}
        <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="input-field"
                placeholder="Enter username"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="input-field"
                placeholder="Enter email address"
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
                className="input-field"
                placeholder="Enter display name"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="input-field"
                placeholder="Min 10 chars, mixed case + digit/symbol"
              />
              <p className="mt-2 text-xs text-slate-600 glass rounded-lg p-2 inline-block">
                💡 Password must be at least 10 characters with uppercase, lowercase, and digit/symbol
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                required
                className="input-field"
              >
                <option value="">Select a role</option>
                {allowedRoles.map(role => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-600 glass rounded-lg p-2 inline-block">
                🔒 You can only create users with roles you have permission to create
              </p>
            </div>

            {/* Role Badges (Visual Guide) */}
            {allowedRoles.length > 0 && (
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-700 mb-3">Available Roles:</p>
                <div className="flex flex-wrap gap-2">
                  {allowedRoles.map(role => (
                    <span
                      key={role}
                      className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${getRoleColor(role)} text-white font-semibold text-xs shadow-lg`}
                    >
                      {role.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                disabled={isLoading}
                className={`btn-primary flex-1 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create User
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};
