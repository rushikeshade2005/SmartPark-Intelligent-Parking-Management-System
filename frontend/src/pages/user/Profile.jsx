import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineLockClosed, HiOutlineShieldCheck, HiOutlineChevronDown,
  HiOutlineEye, HiOutlineEyeOff,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

// Password strength calculator
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: '', color: '' },
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-blue-500' },
    { label: 'Very Strong', color: 'bg-green-500' },
  ];
  return { score, ...levels[score] };
};

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    vehicleNumber: user?.vehicleNumber || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [saving, setSaving] = useState(false);

  // Change password state
  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPw, setChangingPw] = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  // Profile completion
  const profileCompletion = useMemo(() => {
    const fields = [
      { label: 'Name', done: !!user?.name },
      { label: 'Email', done: !!user?.email },
      { label: 'Phone Number', done: !!user?.phoneNumber },
      { label: 'Vehicle Number', done: !!user?.vehicleNumber },
    ];
    const done = fields.filter((f) => f.done).length;
    const percent = Math.round((done / fields.length) * 100);
    return { fields, done, total: fields.length, percent };
  }, [user]);

  const passwordStrength = getPasswordStrength(pwForm.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (pwForm.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setChangingPw(true);
    try {
      await api.put('/auth/change-password', pwForm);
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassword(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card overflow-hidden !p-0"
          >
            {/* Gradient Header */}
            <div className="gradient-bg h-24 relative">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white rounded-full blur-2xl" />
              </div>
            </div>

            <div className="px-6 pb-6 -mt-12 text-center relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white dark:border-dark-card shadow-lg">
                <span className="text-white font-bold text-3xl">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
              </div>
              <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 capitalize">
                {user?.role}
              </div>

              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-dark-border space-y-3 text-sm text-left">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Phone</span>
                  <span className={`${user?.phoneNumber ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
                    {user?.phoneNumber || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Vehicle</span>
                  <span className={`${user?.vehicleNumber ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
                    {user?.vehicleNumber || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Joined</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Completion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Profile Completion</h3>
              <span className={`text-sm font-bold ${profileCompletion.percent === 100 ? 'text-green-600' : 'text-primary-600'}`}>
                {profileCompletion.percent}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion.percent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${profileCompletion.percent === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
              />
            </div>
            <div className="space-y-2">
              {profileCompletion.fields.map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-sm">
                  {f.done ? (
                    <HiOutlineCheckCircle size={16} className="text-green-500 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                  )}
                  <span className={f.done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="input-field bg-gray-50 dark:bg-dark-border cursor-not-allowed"
                    value={user?.email}
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+91 98765 43210"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="MH 01 AB 1234"
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
          >
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <HiOutlineShieldCheck size={22} className="text-primary-600" />
                </div>
                <div className="text-left">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
                  <p className="text-xs text-gray-500">Update your account password</p>
                </div>
              </div>
              <HiOutlineChevronDown
                size={20}
                className={`text-gray-400 transition-transform duration-200 ${showPassword ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showPassword && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handlePasswordChange}
                  className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-border space-y-5 overflow-hidden"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPwCurrent ? 'text' : 'password'}
                        className="input-field pl-10 pr-10"
                        placeholder="Enter current password"
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        required
                      />
                      <button type="button" onClick={() => setShowPwCurrent(!showPwCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwCurrent ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPwNew ? 'text' : 'password'}
                        className="input-field pl-10 pr-10"
                        placeholder="Enter new password"
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPwNew(!showPwNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwNew ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                      </button>
                    </div>
                    {pwForm.newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200 dark:bg-dark-border'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${
                          passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score <= 3 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <HiOutlineLockClosed size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPwConfirm ? 'text' : 'password'}
                        className="input-field pl-10 pr-10"
                        placeholder="Confirm new password"
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPwConfirm(!showPwConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPwConfirm ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                      </button>
                    </div>
                    {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                    {pwForm.confirmPassword && pwForm.newPassword === pwForm.confirmPassword && pwForm.confirmPassword.length >= 6 && (
                      <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><HiOutlineCheckCircle size={12} /> Passwords match</p>
                    )}
                  </div>

                  <button type="submit" disabled={changingPw} className="btn-primary disabled:opacity-50">
                    {changingPw ? 'Changing...' : 'Change Password'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
