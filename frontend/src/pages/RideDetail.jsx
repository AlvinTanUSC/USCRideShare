import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { rideApi } from "../services/api";
import Header from "../components/Header";
import Alert from "../components/Alert";

export default function RideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    fetchRide();
  }, [id]);

  const fetchRide = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await rideApi.getRideById(id);
      setRide(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch ride details");
    } finally {
      setLoading(false);
    }
  };

  // handle cancellation of the ride
  const handleCancelRide = async () => {
    if (!window.confirm("Are you sure you want to cancel this ride?")) {
      return;
    }

    setCancelling(true);
    setCancelError(null);

    try {
      await rideApi.cancelRide(id);
      // Refresh ride data to show updated status
      fetchRide();
    } catch (err) {
      setCancelError(err.response?.data?.error || "Failed to cancel ride");
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "MATCHED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Alert type="error" message={error} onRetry={fetchRide} />
          <button
            onClick={() => navigate("/rides")}
            className="mt-4 text-cardinal-red hover:underline"
          >
            ← Back to Rides
          </button>
        </div>
      </div>
    );
  }

  const isOwner = ride?.userId === currentUserId;
  const canCancel = isOwner && ride?.status !== "CANCELLED";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => navigate("/rides")}
          className="text-cardinal-red hover:underline mb-6 flex items-center"
        >
          ← Back to Rides
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-cardinal-red mb-2">
                {ride.destination.replace("_", " ")}
              </h1>
              <p className="text-gray-600">Posted by {ride.posterFirstName}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                ride.status
              )}`}
            >
              {ride.status}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Origin</h3>
              <p className="text-lg text-gray-900">{ride.originLocation}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Destination
              </h3>
              <p className="text-lg text-gray-900">
                {ride.destination.replace("_", " ")}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Departure Time
              </h3>
              <p className="text-lg text-gray-900">
                {formatDateTime(ride.departureDatetime)}
              </p>
            </div>

            {ride.flexibleTime && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Time Flexibility
                </h3>
                <p className="text-lg text-gray-900">
                  ± {ride.timeFlexibilityMinutes} minutes
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Max Passengers
              </h3>
              <p className="text-lg text-gray-900">{ride.maxPassengers}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Cost Split
              </h3>
              <p className="text-lg text-gray-900">
                {ride.costSplitPreference === "EQUAL" ? "Equal" : "By Distance"}
              </p>
            </div>
          </div>

          {/* Notes */}
          {ride.notes && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-gray-900">{ride.notes}</p>
            </div>
          )}

          {/* Cancel Button - only show if owner and not already cancelled */}
          {canCancel && (
            <div className="border-t pt-6 mt-6">
              {cancelError && (
                <Alert type="error" message={cancelError} className="mb-4" />
              )}
              <button
                onClick={handleCancelRide}
                disabled={cancelling}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors"
              >
                {cancelling ? "Cancelling..." : "Cancel Ride"}
              </button>
            </div>
          )}

          {/* Footer Info */}
          <div className="border-t pt-6 mt-6">
            <p className="text-sm text-gray-500">
              Created on{" "}
              {new Date(ride.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
