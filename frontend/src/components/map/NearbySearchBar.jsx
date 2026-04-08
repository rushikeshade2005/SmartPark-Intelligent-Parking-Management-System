import { useState } from 'react';
import { HiOutlineSearch, HiOutlineLocationMarker } from 'react-icons/hi';

const NearbySearchBar = ({ onSearch, onLocateMe, locating }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch?.(query.trim());
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <form onSubmit={handleSubmit} className="flex-1 relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          className="input-field pl-10 pr-4"
          placeholder="Search by city or parking name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
      <button
        onClick={onLocateMe}
        disabled={locating}
        className="btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
      >
        <HiOutlineLocationMarker size={18} />
        {locating ? 'Locating...' : 'Near Me'}
      </button>
    </div>
  );
};

export default NearbySearchBar;
