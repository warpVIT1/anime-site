"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';

interface UserSettings {
  displayName: string;
  email: string;
  language: string;
  theme: string;
  notifications: {
    newEpisodes: boolean;
    recommendations: boolean;
    updates: boolean;
  };
  privacy: {
    showProfile: boolean;
    showWatchlist: boolean;
    showFavorites: boolean;
  };
}

export default function SettingsPage() {
  const { user, token, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    email: '',
    language: 'en',
    theme: 'dark',
    notifications: {
      newEpisodes: true,
      recommendations: true,
      updates: false,
    },
    privacy: {
      showProfile: true,
      showWatchlist: true,
      showFavorites: true,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState('profile');

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: '', // Will be loaded from API
      }));
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/user/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await logout();
        window.location.href = '/';
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete account' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error' });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const sections = [
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'privacy', label: 'Privacy', icon: 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' },
    { id: 'danger', label: 'Danger Zone', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </h1>
          <p className="text-gray-400 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl ${
            message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64 shrink-0">
            <nav className="bg-gray-900/50 border border-gray-800 rounded-xl p-2 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeSection === section.id
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={section.icon} />
                  </svg>
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Profile Settings</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={settings.displayName}
                      onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                      <option value="ru">Русский</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                    <select
                      value={settings.theme}
                      onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white rounded-xl transition-all"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Security Settings</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <button
                    onClick={changePassword}
                    disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white rounded-xl transition-all"
                  >
                    {isSaving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Notification Settings</h2>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-white font-medium">New Episode Alerts</p>
                        <p className="text-sm text-gray-400">Get notified when new episodes are released</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.newEpisodes}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, newEpisodes: e.target.checked }
                        })}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-violet-600 focus:ring-violet-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-white font-medium">Recommendations</p>
                        <p className="text-sm text-gray-400">Receive personalized anime recommendations</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.recommendations}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, recommendations: e.target.checked }
                        })}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-violet-600 focus:ring-violet-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-white font-medium">Site Updates</p>
                        <p className="text-sm text-gray-400">News about site features and updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.updates}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, updates: e.target.checked }
                        })}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-violet-600 focus:ring-violet-500"
                      />
                    </label>
                  </div>

                  <button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white rounded-xl transition-all"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">Privacy Settings</h2>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-white font-medium">Public Profile</p>
                        <p className="text-sm text-gray-400">Allow others to view your profile</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.privacy.showProfile}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, showProfile: e.target.checked }
                        })}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-violet-600 focus:ring-violet-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-white font-medium">Show Watchlist</p>
                        <p className="text-sm text-gray-400">Make your watchlist visible to others</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.privacy.showWatchlist}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, showWatchlist: e.target.checked }
                        })}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-violet-600 focus:ring-violet-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer">
                      <div>
                        <p className="text-white font-medium">Show Favorites</p>
                        <p className="text-sm text-gray-400">Make your favorites visible to others</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.privacy.showFavorites}
                        onChange={(e) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, showFavorites: e.target.checked }
                        })}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-violet-600 focus:ring-violet-500"
                      />
                    </label>
                  </div>

                  <button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white rounded-xl transition-all"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Danger Zone */}
              {activeSection === 'danger' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
                  <p className="text-gray-400">These actions are irreversible. Please proceed with caution.</p>

                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <h3 className="text-white font-medium mb-2">Delete Account</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Permanently delete your account and all associated data. This cannot be undone.
                    </p>
                    <button
                      onClick={deleteAccount}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all"
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Profile */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
