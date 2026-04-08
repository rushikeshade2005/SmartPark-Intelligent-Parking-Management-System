import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
  HiOutlineLocationMarker, HiOutlinePhotograph, HiOutlineUpload,
  HiOutlinePhone, HiOutlineMail, HiOutlineShieldCheck, HiOutlineUser,
} from 'react-icons/hi';
import LocationPickerMap from '../../components/map/LocationPickerMap';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ManageParkingLots = () => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageModal, setImageModal] = useState(null); // lot for image management

  const defaultForm = {
    name: '', description: '', address: '', area: '', city: '',
    totalFloors: 1, totalSlots: 10, pricePerHour: 50,
    parkingType: 'both', amenities: '',
    latitude: '', longitude: '',
    openTime: '06:00', closeTime: '22:00',
    securityAvailable: false, cctvAvailable: false, evChargingAvailable: false,
    ownerName: '', ownerPhone: '', ownerEmail: '',
    contactPhone: '', contactEmail: '', managerContact: '',
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const res = await api.get('/parking-lots');
      setLots(res.data.data);
    } catch (err) {
      toast.error('Failed to load parking lots');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (lot) => {
    setEditing(lot);
    setForm({
      name: lot.name,
      description: lot.description || '',
      address: lot.address,
      area: lot.area || '',
      city: lot.city,
      totalFloors: lot.totalFloors,
      totalSlots: lot.totalSlots,
      pricePerHour: lot.pricePerHour,
      parkingType: lot.parkingType || 'both',
      amenities: lot.amenities?.join(', ') || '',
      latitude: lot.locationCoordinates?.lat || '',
      longitude: lot.locationCoordinates?.lng || '',
      openTime: lot.operatingHours?.open || '06:00',
      closeTime: lot.operatingHours?.close || '22:00',
      securityAvailable: lot.securityAvailable || false,
      cctvAvailable: lot.cctvAvailable || false,
      evChargingAvailable: lot.evChargingAvailable || false,
      ownerName: lot.ownerName || '',
      ownerPhone: lot.ownerPhone || '',
      ownerEmail: lot.ownerEmail || '',
      contactPhone: lot.contactPhone || '',
      contactEmail: lot.contactEmail || '',
      managerContact: lot.managerContact || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        address: form.address,
        area: form.area,
        city: form.city,
        totalFloors: Number(form.totalFloors),
        totalSlots: Number(form.totalSlots),
        pricePerHour: Number(form.pricePerHour),
        parkingType: form.parkingType,
        amenities: form.amenities ? form.amenities.split(',').map((a) => a.trim()) : [],
        locationCoordinates: {
          lat: form.latitude ? Number(form.latitude) : 0,
          lng: form.longitude ? Number(form.longitude) : 0,
        },
        operatingHours: { open: form.openTime, close: form.closeTime },
        securityAvailable: form.securityAvailable,
        cctvAvailable: form.cctvAvailable,
        evChargingAvailable: form.evChargingAvailable,
        ownerName: form.ownerName,
        ownerPhone: form.ownerPhone,
        ownerEmail: form.ownerEmail,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        managerContact: form.managerContact,
      };

      if (editing) {
        await api.put(`/parking-lots/${editing._id}`, payload);
        toast.success('Parking lot updated');
      } else {
        await api.post('/parking-lots', payload);
        toast.success('Parking lot created with floors and slots');
      }
      setShowModal(false);
      fetchLots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this parking lot and all its slots?')) return;
    try {
      await api.delete(`/parking-lots/${id}`);
      toast.success('Parking lot deleted');
      fetchLots();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${BACKEND_URL}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  const getLotImages = (lot) => {
    const imgs = [];
    if (lot.image) imgs.push(lot.image);
    if (lot.images?.length) imgs.push(...lot.images);
    return [...new Set(imgs)];
  };

  const handleImageUpload = async (lotId, files) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('images', f));
      await api.post(`/parking-lots/${lotId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Images uploaded successfully!');
      fetchLots();
      // Refresh image modal data
      const res = await api.get(`/parking-lots/${lotId}`);
      setImageModal(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageDelete = async (lotId, imageUrl) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.delete(`/parking-lots/${lotId}/images`, { data: { imageUrl } });
      toast.success('Image deleted');
      fetchLots();
      const res = await api.get(`/parking-lots/${lotId}`);
      setImageModal(res.data.data);
    } catch (err) {
      toast.error('Failed to delete image');
    }
  };

  const openImageModal = async (lot) => {
    try {
      const res = await api.get(`/parking-lots/${lot._id}`);
      setImageModal(res.data.data);
    } catch {
      setImageModal(lot);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Parking Lots</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus size={18} />
          Add Parking Lot
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editing ? 'Edit Parking Lot' : 'Add New Parking Lot'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
                <HiOutlineX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="City Center Parking"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  className="input-field min-h-[60px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="A brief description of the parking lot..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address *</label>
                <input
                  className="input-field"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area / Locality</label>
                  <input
                    className="input-field"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    placeholder="Andheri West"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                  <input
                    className="input-field"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Mumbai"
                    required
                  />
                </div>
              </div>

              {/* Capacity & Pricing */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floors</label>
                  <input type="number" className="input-field" value={form.totalFloors}
                    onChange={(e) => setForm({ ...form, totalFloors: e.target.value })} min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Slots</label>
                  <input type="number" className="input-field" value={form.totalSlots}
                    onChange={(e) => setForm({ ...form, totalSlots: e.target.value })} min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">₹/Hour</label>
                  <input type="number" className="input-field" value={form.pricePerHour}
                    onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })} min="0" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select className="input-field" value={form.parkingType}
                    onChange={(e) => setForm({ ...form, parkingType: e.target.value })}>
                    <option value="both">Car & Bike</option>
                    <option value="car">Car Only</option>
                    <option value="bike">Bike Only</option>
                  </select>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Time</label>
                  <input type="time" className="input-field" value={form.openTime}
                    onChange={(e) => setForm({ ...form, openTime: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Closing Time</label>
                  <input type="time" className="input-field" value={form.closeTime}
                    onChange={(e) => setForm({ ...form, closeTime: e.target.value })} />
                </div>
              </div>

              {/* Location */}
              <LocationPickerMap
                position={form.latitude && form.longitude ? [Number(form.latitude), Number(form.longitude)] : null}
                onLocationSelect={([lat, lng]) => setForm({ ...form, latitude: lat, longitude: lng })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amenities (comma separated)
                </label>
                <input className="input-field" value={form.amenities}
                  onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                  placeholder="Covered, Wheelchair Access, Valet" />
              </div>

              {/* Facility Toggles */}
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'securityAvailable', label: '🛡️ Security' },
                  { key: 'cctvAvailable', label: '📹 CCTV' },
                  { key: 'evChargingAvailable', label: '⚡ EV Charging' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-primary-600 rounded"
                      checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>

              {/* Owner Info */}
              <div className="border-t border-gray-100 dark:border-dark-border pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                  <HiOutlineUser size={15} /> Owner / Management
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Owner Name</label>
                    <input className="input-field" value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Owner Phone</label>
                    <input className="input-field" value={form.ownerPhone}
                      onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })} placeholder="+91 98765..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Owner Email</label>
                    <input type="email" className="input-field" value={form.ownerEmail}
                      onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} placeholder="owner@..." />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <HiOutlinePhone size={12} /> Support Phone
                  </label>
                  <input className="input-field" value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <HiOutlineMail size={12} /> Support Email
                  </label>
                  <input type="email" className="input-field" value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="support@..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Manager Contact</label>
                  <input className="input-field" value={form.managerContact}
                    onChange={(e) => setForm({ ...form, managerContact: e.target.value })} placeholder="+91..." />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create Parking Lot'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Image Management Modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-dark-card rounded-xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HiOutlinePhotograph size={22} />
                Photos — {imageModal.name}
              </h2>
              <button onClick={() => setImageModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
                <HiOutlineX size={20} />
              </button>
            </div>

            {/* Upload Section */}
            <div className="mb-6">
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl p-6 cursor-pointer hover:border-primary-400 transition-colors">
                <HiOutlineUpload size={24} className="text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">
                  {uploadingImages ? 'Uploading...' : 'Click to upload images (max 10 at a time)'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImages}
                  onChange={(e) => handleImageUpload(imageModal._id, e.target.files)}
                />
              </label>
            </div>

            {/* Existing Images Grid */}
            {getLotImages(imageModal).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {getLotImages(imageModal).map((img, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden aspect-video bg-gray-100 dark:bg-dark-border">
                    <img
                      src={getImageUrl(img)}
                      alt={`Parking ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleImageDelete(imageModal._id, img)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Delete image"
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <HiOutlinePhotograph size={48} className="mx-auto mb-2 opacity-50" />
                <p>No photos uploaded yet</p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Lots Grid */}
      {lots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lots.map((lot) => {
            const lotImgs = getLotImages(lot);
            return (
              <motion.div
                key={lot._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card overflow-hidden"
              >
                {/* Thumbnail */}
                {lotImgs.length > 0 ? (
                  <div className="relative -mx-6 -mt-6 mb-4 h-40 bg-gray-100 dark:bg-dark-border cursor-pointer" onClick={() => openImageModal(lot)}>
                    <img src={getImageUrl(lotImgs[0])} alt={lot.name} className="w-full h-full object-cover" />
                    {lotImgs.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                        <HiOutlinePhotograph size={12} /> {lotImgs.length}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className="relative -mx-6 -mt-6 mb-4 h-28 bg-gray-50 dark:bg-dark-border flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-border/80 transition-colors"
                    onClick={() => openImageModal(lot)}
                  >
                    <div className="text-center text-gray-400">
                      <HiOutlineUpload size={24} className="mx-auto mb-1" />
                      <span className="text-xs">Add Photos</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white">{lot.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openImageModal(lot)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg text-gray-500 hover:text-primary-600"
                      title="Manage Photos"
                    >
                      <HiOutlinePhotograph size={16} />
                    </button>
                    <button
                      onClick={() => openEdit(lot)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg text-gray-500 hover:text-primary-600"
                    >
                      <HiOutlinePencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(lot._id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-500 hover:text-red-600"
                    >
                      <HiOutlineTrash size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{lot.address}, {lot.city}</p>
                {lot.locationCoordinates?.lat && lot.locationCoordinates?.lng ? (
                  <p className="text-xs text-primary-500 flex items-center gap-1 mt-1">
                    <HiOutlineLocationMarker size={12} />
                    {lot.locationCoordinates.lat.toFixed(4)}, {lot.locationCoordinates.lng.toFixed(4)}
                  </p>
                ) : (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <HiOutlineLocationMarker size={12} />
                    No location set
                  </p>
                )}

                {/* Contact Info */}
                {(lot.contactPhone || lot.contactEmail) && (
                  <div className="mt-2 space-y-0.5">
                    {lot.contactPhone && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <HiOutlinePhone size={12} /> {lot.contactPhone}
                      </p>
                    )}
                    {lot.contactEmail && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <HiOutlineMail size={12} /> {lot.contactEmail}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-dark-border text-center text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Floors</p>
                    <p className="font-bold text-gray-900 dark:text-white">{lot.totalFloors}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Slots</p>
                    <p className="font-bold text-gray-900 dark:text-white">{lot.totalSlots}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Price</p>
                    <p className="font-bold text-primary-600">{formatCurrency(lot.pricePerHour)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-5xl mb-4">🏢</p>
          <p className="text-lg font-semibold">No parking lots yet</p>
          <p className="text-sm mt-1">Create your first parking lot to get started</p>
        </div>
      )}
    </div>
  );
};

export default ManageParkingLots;
