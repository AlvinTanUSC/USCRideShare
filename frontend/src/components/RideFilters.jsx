export default function RideFilters({ filters, onFilterChange }) {
  const destinations = ['All', 'LAX', 'BUR', 'ONT', 'UNION_STATION'];

  const handleChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value === '' || value === 'All' ? null : value,
    });
  };

  const handleReset = () => {
    onFilterChange({
      destination: null,
      date: null,
      time: null,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-cardinal-red mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination
          </label>
          <select
            value={filters.destination || 'All'}
            onChange={(e) => handleChange('destination', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red"
          >
            {destinations.map((dest) => (
              <option key={dest} value={dest}>
                {dest.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={filters.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time
          </label>
          <input
            type="time"
            value={filters.time || ''}
            onChange={(e) => handleChange('time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red"
          />
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
