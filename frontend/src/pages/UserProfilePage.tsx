import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { User, AuditLog } from '../types';
import { usersAPI } from '../api/users';
import apiClient from '../api/client';

type TabType = 'overview' | 'activity' | 'sessions';

interface SessionInfo {
  id: string;
  device_name?: string;
  ip_address?: string;
  created_at: string;
  expires_at: string;
  is_current?: boolean;
}

interface ActivityStats {
  totalLogins: number;
  loginsThisMonth: number;
  productsCreated: number;
  productsUpdated: number;
  lastLoginAt: string | null;
}

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    if (id) {
      loadUser();
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'sessions') {
      loadSessions();
    } else if (id && activeTab === 'activity') {
      loadActivity();
    }
  }, [activeTab, id]);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const userData = await usersAPI.getById(id!);
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const endpoint = isOwnProfile ? '/sessions' : `/sessions/${id}`;
      const response = await apiClient.get(endpoint);
      setSessions(response.data.sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadActivity = async () => {
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        apiClient.get(`/audit?actor_user_id=${id}&limit=20`),
        apiClient.get(`/sessions/activity/${id}`),
      ]);
      setActivityLogs(logsResponse.data.data);
      setActivityStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!window.confirm('Revoke this session? The device will be logged out.')) return;

    try {
      await apiClient.delete(`/sessions/${sessionId}`);
      alert('✅ Session revoked successfully');
      loadSessions();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!window.confirm('Revoke all other sessions? You will remain logged in on this device only.')) return;

    try {
      const response = await apiClient.post('/sessions/revoke-all');
      alert(`✅ ${response.data.message}`);
      loadSessions();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to revoke sessions');
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    const colorMap: Record<string, string> = {
      'owner_ultimate_super_admin': 'from-purple-500 to-pink-500',
      'admin': 'from-blue-500 to-cyan-500',
      'cashier': 'from-green-500 to-emerald-500',
      'inventory_manager': 'from-orange-500 to-amber-500',
      'guest': 'from-slate-500 to-gray-500',
    };
    return colorMap[role] || 'from-slate-500 to-gray-500';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const timeAgo = (dateString: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="glass rounded-3xl p-12 text-center shadow-xl max-w-2xl mx-auto">
          <p className="text-red-600 font-semibold mb-4">User not found</p>
          <Link to="/users" className="btn-primary inline-flex items-center gap-2">
            Back to Users
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-8 shadow-xl animate-slide-down">
          <Link to="/users" className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Users
          </Link>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className={`w-24 h-24 bg-gradient-to-br ${getRoleBadgeColor(user.role)} rounded-2xl flex items-center justify-center text-4xl text-white font-bold shadow-lg`}>
              {user.display_name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{user.display_name}</h1>
              <p className="text-slate-600 mb-2">@{user.username} • {user.email}</p>
              <div className="flex gap-2 items-center">
                <span className={`inline-block px-4 py-2 rounded-xl bg-gradient-to-r ${getRoleBadgeColor(user.role)} text-white font-semibold text-sm shadow-lg`}>
                  {user.role.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className={`inline-block px-3 py-1 rounded-lg font-semibold text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.is_active ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass rounded-2xl p-2 shadow-lg flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-primary-50'
            }`}
          >
            📋 Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'activity'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-primary-50'
            }`}
          >
            📊 Activity
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'sessions'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-primary-50'
            }`}
          >
            📱 Sessions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Basic Info */}
            <div className="glass rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">User ID</div>
                  <div className="text-slate-800 font-mono text-sm bg-slate-100 px-4 py-2 rounded-lg">{user.id}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Last Login</div>
                  <div className="text-slate-800">{user.last_login_at ? formatDate(user.last_login_at) : 'Never'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Created</div>
                  <div className="text-slate-800">{formatDate(user.created_at)}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-600 mb-1">Last Updated</div>
                  <div className="text-slate-800">{formatDate(user.updated_at)}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {isOwnProfile && (
              <div className="glass rounded-3xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link to="/settings/change-password" className="btn-primary text-center">
                    <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </Link>
                  <button onClick={() => setActiveTab('sessions')} className="btn-secondary text-center">
                    <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Manage Sessions
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6 animate-fade-in">
            {/* Activity Stats */}
            {activityStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass rounded-2xl p-4 shadow-lg text-center">
                  <div className="text-3xl font-bold text-primary-600">{activityStats.totalLogins}</div>
                  <div className="text-sm text-slate-600 mt-1">Total Logins</div>
                </div>
                <div className="glass rounded-2xl p-4 shadow-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{activityStats.loginsThisMonth}</div>
                  <div className="text-sm text-slate-600 mt-1">Logins (30d)</div>
                </div>
                <div className="glass rounded-2xl p-4 shadow-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">{activityStats.productsCreated}</div>
                  <div className="text-sm text-slate-600 mt-1">Products Created</div>
                </div>
                <div className="glass rounded-2xl p-4 shadow-lg text-center">
                  <div className="text-3xl font-bold text-orange-600">{activityStats.productsUpdated}</div>
                  <div className="text-sm text-slate-600 mt-1">Products Updated</div>
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="glass rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Activity</h2>
              {activityLogs.length === 0 ? (
                <p className="text-center text-slate-600 py-8">No recent activity</p>
              ) : (
                <div className="space-y-4">
                  {activityLogs.map((log, idx) => (
                    <div key={log.id} className="flex gap-4 p-4 glass rounded-xl hover:scale-105 transition-transform" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                          {log.action.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</div>
                        {log.target && (
                          <div className="text-sm text-slate-600">Target: {log.target.username}</div>
                        )}
                        <div className="text-xs text-slate-500 mt-1">{timeAgo(log.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6 animate-fade-in">
            {/* Sessions Header */}
            <div className="glass rounded-3xl p-6 shadow-xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Active Sessions</h2>
                <p className="text-slate-600 text-sm mt-1">{sessions.length} active session(s)</p>
              </div>
              {sessions.length > 1 && (
                <button onClick={handleRevokeAllSessions} className="btn-secondary">
                  Revoke All Others
                </button>
              )}
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="glass rounded-3xl p-12 text-center shadow-xl">
                  <p className="text-slate-600">No active sessions</p>
                </div>
              ) : (
                sessions.map((session, idx) => (
                  <div
                    key={session.id}
                    className={`glass rounded-2xl p-6 shadow-lg ${session.is_current ? 'border-2 border-primary-400' : ''}`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-semibold text-slate-800 text-lg">{session.device_name || 'Unknown Device'}</div>
                          {session.is_current && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">
                              Current Session
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div>📍 IP: {session.ip_address || 'Unknown'}</div>
                          <div>🕐 Created: {formatDate(session.created_at)}</div>
                          <div>⏰ Expires: {formatDate(session.expires_at)}</div>
                        </div>
                      </div>
                      {!session.is_current && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-200 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};





