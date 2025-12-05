import { useEffect, useState } from "react";
import { rideApi } from "../services/api";
import Header from "../components/Header";
import RideCard from "../components/RideCard";
import Alert from "../components/Alert";

export default function MyRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyRides();
    // eslint-disable-next-line
  }, []);

  const fetchMyRides = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rideApi.getMyRides();
      setRides(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your rides.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-cardinal-red mb-6">My Rides</h1>
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onRetry={fetchMyRides} />
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
            <p className="text-gray-500 text-lg">
              You have not posted any rides yet.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Post a ride to see it here.
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
