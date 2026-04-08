import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import ParkingLotCard from '../../components/parking/ParkingLotCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineX } from 'react-icons/hi';
import { FiChevronDown } from 'react-icons/fi';

const ParkingLots = () => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('name');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const res = await api.get('/parking-lots');
      setLots(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cities = [...new Set(lots.map((l) => l.city))].sort();

  const filteredLots = lots
    .filter(
      (l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.city.toLowerCase().includes(search.toLowerCase()) ||
        l.address.toLowerCase().includes(search.toLowerCase())
    )
    .filter((l) => l.pricePerHour >= priceRange[0] && l.pricePerHour <= priceRange[1])
    .filter((l) => {
      if (availabilityFilter === 'available') return l.availableSlots > 0;
      if (availabilityFilter === 'full') return l.availableSlots === 0;
      return true;
    })
    .filter((l) => cityFilter === 'all' || l.city === cityFilter)
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.pricePerHour - b.pricePerHour;
      if (sortBy === 'price-high') return b.pricePerHour - a.pricePerHour;
      if (sortBy === 'available') return b.availableSlots - a.availableSlots;
      return a.name.localeCompare(b.name);
    });

  const clearFilters = () => {
    setPriceRange([0, 500]);
    setSortBy('name');
    setAvailabilityFilter('all');
    setCityFilter('all');
  };

  const activeFilterCount = [
    priceRange[0] > 0 || priceRange[1] < 500,
    sortBy !== 'name',
    availabilityFilter !== 'all',
    cityFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Find <span className="text-primary-600">Parking</span>
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Browse available parking locations near you
          </p>
        </motion.div>

        {/* Search + Filter Toggle */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <HiOutlineSearch size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, city, or address..."
                className="input-field pl-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <HiOutlineFilter size={18} />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-white/20 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700">
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Price (₹/hr)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full accent-blue-600"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    Up to ₹{priceRange[1]}/hr
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm appearance-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="name">Name</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="available">Most Available</option>
                    </select>
                    <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Availability</label>
                  <div className="relative">
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm appearance-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="available">Available</option>
                      <option value="full">Full</option>
                    </select>
                    <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <div className="relative">
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm appearance-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Cities</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results count */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-7xl text-right">
          {filteredLots.length} of {lots.length} parking lots
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filteredLots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLots.map((lot) => (
              <ParkingLotCard key={lot._id} lot={lot} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-5xl mb-4">🅿️</p>
            <p className="text-xl font-semibold">No parking lots found</p>
            <p className="mt-2 text-sm">Try adjusting your search or filters.</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingLots;
