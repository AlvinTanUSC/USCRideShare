import { useNavigate } from 'react-router-dom';

export default function RideCard({ ride }) {
  const navigate = useNavigate();

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'MATCHED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
      onClick={() => navigate(`/rides/${ride.rideId}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-2xl font-bold text-cardinal-red">
          {ride.destination.replace('_', ' ')}
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(ride.status)}`}>
          {ride.status}
        </span>
      </div>

      <div className="space-y-2 text-gray-700">
        <p className="flex items-center">
          <span className="font-medium">From:</span>
          <span className="ml-2">{ride.originLocation}</span>
        </p>

        <p className="flex items-center">
          <span className="font-medium">When:</span>
          <span className="ml-2">{formatDateTime(ride.departureDatetime)}</span>
        </p>

        {ride.flexibleTime && (
          <p className="text-sm text-gray-600">
            ± {ride.timeFlexibilityMinutes} minutes flexibility
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <p className="text-sm">
            <span className="font-medium">Max passengers:</span> {ride.maxPassengers}
          </p>
          <p className="text-sm text-gray-600">
            by {ride.posterFirstName}
          </p>
        </div>
      </div>
    </div>
  );
}
