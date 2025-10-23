import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { User, UserRole } from '../types';
import { usersAPI } from '../api/users';

export const UsersPage = () => {
  const { permissions } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterActive, setFilterActive] = useState<boolean | ''>('');

  useEffect(() => {
    loadUsers();
  }, [searchQuery, filterRole, filterActive]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      if (filterRole) params.role = filterRole;
      if (filterActive !== '') params.is_active = filterActive;

      const response = await usersAPI.list(params);
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (!permissions?.can_change_status) {
      alert('You do not have permission to change user status');
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.username}?`
    );
    if (!confirm) return;

    try {
      await usersAPI.updateStatus(user.id, !user.is_active);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update user status');
    }
  };

  const handleDelete = async (user: User) => {
    if (!permissions?.can_delete_users) {
      alert('You do not have permission to delete users');
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to delete ${user.username}? This action cannot be undone.`
    );
    if (!confirm) return;

    try {
      await usersAPI.delete(user.id);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete user');
    }
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-down">
          <div>
            <h1 className="text-3xl font-bold gradient-text">User Management</h1>
            <p className="text-slate-600 text-sm mt-1">Manage system users and permissions</p>
          </div>
          {permissions?.can_create_users && (
            <Link
              to="/users/new"
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create User
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div className="glass rounded-2xl p-6 shadow-lg animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search Users</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search by username, email, or name..."
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Role Filter</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
                className="input-field"
              >
                <option value="">All Roles</option>
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status Filter</label>
              <select
                value={filterActive === '' ? '' : filterActive ? 'true' : 'false'}
                onChange={(e) => setFilterActive(e.target.value === '' ? '' : e.target.value === 'true')}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="glass rounded-3xl overflow-hidden shadow-xl animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="inline-block w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-block w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-slate-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Last Login</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className="border-t border-slate-100 hover:bg-primary-50/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{user.display_name}</div>
                        <div className="text-sm text-slate-600">{user.email}</div>
                        <div className="text-xs text-slate-400 font-mono">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${getRoleColor(user.role)} text-white font-semibold text-xs shadow-lg`}>
                          {user.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-lg font-semibold text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {permissions?.can_change_status && (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all duration-300 transform hover:scale-105 ${
                                user.is_active 
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                          {permissions?.can_delete_users && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-semibold text-xs hover:bg-red-200 transition-all duration-300 transform hover:scale-105"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
