import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import { HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
  });
  const canCreateAdmins =
    currentUser?.isMasterAdmin === true || currentUser?.email === 'admin@smartpark.com';
  const canDeleteUsers = canCreateAdmins;

  useEffect(() => {
    fetchUsers();
    fetchAdmins();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/admins');
      setAdmins(res.data.data);
    } catch {
      toast.error('Failed to load admins');
    }
  };

  const handleDelete = async (id, name) => {
    if (!canDeleteUsers) {
      toast.error('Only the master admin can delete users');
      return;
    }
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeleteAdmin = async (id, name) => {
    if (!canDeleteUsers) {
      toast.error('Only the master admin can delete users');
      return;
    }
    if (!confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('Admin deleted');
      setAdmins(admins.filter((a) => a._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  const filtered = activeTab === 'users' 
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : admins.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase())
      );

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreatingAdmin(true);
    try {
      await api.post('/auth/register-admin', {
        name: adminForm.name.trim(),
        email: adminForm.email.trim().toLowerCase(),
        password: adminForm.password,
        phoneNumber: adminForm.phoneNumber.trim(),
      });
      toast.success('Admin created successfully');
      setAdminForm({ name: '', email: '', password: '', phoneNumber: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manage Users & Admins</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-dark-border">
        <button
          onClick={() => {
            setActiveTab('users');
            setSearch('');
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          📋 Regular Users ({users.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('admins');
            setSearch('');
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'admins'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          👨‍💼 Admins ({admins.length})
        </button>
      </div>

      {/* Create Admin Form - Only show on Admins tab and only for master admin */}
      {activeTab === 'admins' && (
        canCreateAdmins ? (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Admin</h2>
            <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                className="input-field"
                placeholder="Admin name"
                value={adminForm.name}
                onChange={(e) => setAdminForm((prev) => ({ ...prev, name: e.target.value }))}
                required
            />
            <input
              type="email"
              className="input-field"
              placeholder="Admin email"
              value={adminForm.email}
              onChange={(e) => setAdminForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <input
              type="password"
              className="input-field"
              placeholder="Min 6 character password"
              value={adminForm.password}
              onChange={(e) => setAdminForm((prev) => ({ ...prev, password: e.target.value }))}
              minLength={6}
              required
            />
            <input
              className="input-field"
              placeholder="Phone number (optional)"
              value={adminForm.phoneNumber}
              onChange={(e) => setAdminForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            />
            <div className="md:col-span-2 lg:col-span-4">
              <button type="submit" className="btn-primary" disabled={creatingAdmin}>
                {creatingAdmin ? 'Creating Admin...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>
        ) : (
          <div className="card mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-300">Master Admin Only</h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">Only the main admin can create new admin accounts</p>
              </div>
            </div>
          </div>
        )
      )}

      <div className="relative mb-6 max-w-md">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          className="input-field pl-10"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Phone</th>
                {activeTab === 'users' && <th className="py-3 px-4 font-medium">Vehicle</th>}
                <th className="py-3 px-4 font-medium">Joined</th>
                <th className="py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {filtered.map((item) => (
                <motion.tr
                  key={item._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-dark-border/30"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{item.email}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{item.phoneNumber || '—'}</td>
                  {activeTab === 'users' && (
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{item.vehicleNumber || '—'}</td>
                  )}
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{formatDate(item.createdAt)}</td>
                  <td className="py-3 px-4">
                    {activeTab === 'users' && canDeleteUsers ? (
                      <button
                        onClick={() => handleDelete(item._id, item.name)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete user"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">-</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-gray-500">
              No {activeTab === 'users' ? 'regular users' : 'admins'} found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
