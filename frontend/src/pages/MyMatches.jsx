import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchApi } from '../services/api';
import Header from '../components/Header';
import Alert from '../components/Alert';

export default function MyMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(null);
  const [completeError, setCompleteError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await matchApi.getUserMatches();
      setMatches(response.data || []);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACCEPTED: 'bg-green-100 text-green-800',
      SUGGESTED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const handleCompleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to mark this rideshare as completed?')) {
      return;
    }

    setCompleting(matchId);
    setCompleteError(null);

    try {
      await matchApi.completeMatch(matchId);
      // Refresh matches to show updated status
      await loadMatches();
    } catch (err) {
      console.error('Error completing match:', err);
      setCompleteError(err.response?.data?.error || 'Failed to complete match');
    } finally {
      setCompleting(null);
    }
  };

  const handleAcceptMatch = async (matchId) => {
    setActionLoading(matchId);
    setActionError(null);

    try {
      await matchApi.updateMatchStatus(matchId, 'ACCEPTED');
      // Refresh matches to show updated status
      await loadMatches();
    } catch (err) {
      console.error('Error accepting match:', err);
      setActionError(err.response?.data?.error || 'Failed to accept match');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to reject this match?')) {
      return;
    }

    setActionLoading(matchId);
    setActionError(null);

    try {
      await matchApi.updateMatchStatus(matchId, 'REJECTED');
      // Refresh matches to show updated status
      await loadMatches();
    } catch (err) {
      console.error('Error rejecting match:', err);
      setActionError(err.response?.data?.error || 'Failed to reject match');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your matches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-cardinal-red mb-6">My Matches</h1>

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🚗</div>
            <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
            <p className="text-gray-600 mb-6">
              Start by creating a ride or finding a match to connect with other Trojans!
            </p>
            <button
              onClick={() => navigate('/rides/match')}
              className="px-6 py-2 bg-cardinal-red text-white rounded-md hover:bg-red-800 transition"
            >
              Find a Match
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const isRide1Owner = match.ride1.user.userId === currentUserId;
              const myRide = isRide1Owner ? match.ride1 : match.ride2;
              const otherRide = isRide1Owner ? match.ride2 : match.ride1;
              const otherUser = otherRide.user;

              return (
                <div key={match.matchId} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Matched with {otherUser.firstName} {otherUser.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{otherUser.email}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        match.status
                      )}`}
                    >
                      {match.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Your Ride</p>
                      <p className="text-sm">
                        <span className="font-medium">From:</span> {myRide.originLocation}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">To:</span>{' '}
                        {myRide.destination.replace('_', ' ')}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Time:</span>{' '}
                        {formatTime(myRide.departureDatetime)}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Their Ride</p>
                      <p className="text-sm">
                        <span className="font-medium">From:</span> {otherRide.originLocation}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">To:</span>{' '}
                        {otherRide.destination.replace('_', ' ')}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Time:</span>{' '}
                        {formatTime(otherRide.departureDatetime)}
                      </p>
                    </div>
                  </div>

                  {completeError && match.matchId === completing && (
                    <div className="mb-4">
                      <Alert type="error" message={completeError} />
                    </div>
                  )}

                  {actionError && match.matchId === actionLoading && (
                    <div className="mb-4">
                      <Alert type="error" message={actionError} />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/chat/${match.matchId}`)}
                      className="flex-1 px-4 py-2 bg-cardinal-red text-white rounded-md hover:bg-red-800 transition font-medium"
                    >
                      💬 Open Chat
                    </button>
                    <button
                      onClick={() => navigate(`/rides/${myRide.rideId}`)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                    >
                      View Details
                    </button>
                  </div>

                  {match.status === 'SUGGESTED' && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleAcceptMatch(match.matchId)}
                        disabled={actionLoading === match.matchId}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition font-medium"
                      >
                        {actionLoading === match.matchId ? 'Accepting...' : '✓ Accept Match'}
                      </button>
                      <button
                        onClick={() => handleRejectMatch(match.matchId)}
                        disabled={actionLoading === match.matchId}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 transition font-medium"
                      >
                        {actionLoading === match.matchId ? 'Rejecting...' : '✗ Reject Match'}
                      </button>
                    </div>
                  )}

                  {match.status === 'ACCEPTED' && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleCompleteMatch(match.matchId)}
                        disabled={completing === match.matchId}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition font-medium"
                      >
                        {completing === match.matchId
                          ? 'Completing...'
                          : '✓ Mark as Completed'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
