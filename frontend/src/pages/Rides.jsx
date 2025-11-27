import { useState, useEffect } from 'react';
import { rideApi } from '../services/api';
import Header from '../components/Header';
import RideCard from '../components/RideCard';
import RideFilters from '../components/RideFilters';
import Alert from '../components/Alert';

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [filters, setFilters] = useState({
    destination: null,
    date: null,
    time: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRides();
  }, [filters]);

  const fetchRides = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await rideApi.getRides(filters);
      setRides(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-cardinal-red mb-6">Browse Rides</h1>

        <RideFilters filters={filters} onFilterChange={setFilters} />

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onRetry={fetchRides} />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No rides found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides.map((ride) => (
              <RideCard key={ride.rideId} ride={ride} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
