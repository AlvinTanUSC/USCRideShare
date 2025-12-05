import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { rideApi, matchApi } from '../services/api';
import Header from '../components/Header';
import Alert from '../components/Alert';

export default function RideMatch() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userEmail')?.split('@')[0] || 'Trojan';

  // Form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('LAX');
  const [datetime, setDatetime] = useState('');

  // App state
  const [step, setStep] = useState('form'); // form, searching, results, waiting
  const [myRideId, setMyRideId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollIntervalRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!authToken || !userId) {
      console.error('User not authenticated. Redirecting to login...');
      setError('Please log in to find matches');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [navigate]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!origin.trim() || !datetime) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);
    setStep('searching');

    try {
      // Convert datetime-local to ISO instant string
      const departureIso = datetime ? new Date(datetime).toISOString() : null;

      // Default time flexibility minutes
      const timeFlexMinutes = 10;

      const rideData = {
        originLocation: origin,
        destination,
        departureDatetime: departureIso,
        flexibleTime: true,
        timeFlexibilityMinutes: timeFlexMinutes,
        maxPassengers: 2,
      };

      console.log('Creating ride with data:', rideData);
      const response = await rideApi.createRide(rideData);
      console.log('Ride created successfully:', response.data);

      setMyRideId(response.data.rideId);
      setStep('waiting');

      // Immediately fetch potential matches once
      try {
        console.log('Fetching potential matches for ride:', response.data.rideId);
        const potentialMatchesRes = await matchApi.findPotentialMatches(response.data.rideId);
        console.log('Potential matches found:', potentialMatchesRes.data);
        setMatches(potentialMatchesRes.data || []);
        if ((potentialMatchesRes.data || []).length > 0) {
          setStep('results');
        }
      } catch (matchErr) {
        console.error('Error fetching potential matches:', matchErr);
        console.error('Match error details:', matchErr.response?.data);
        // Show the error to the user
        setError(`Could not fetch matches: ${matchErr.response?.data?.error || matchErr.message}`);
        setStep('form');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create ride';
      setError(msg);
      console.error('Create ride failed:', msg, err);
      console.error('Full error:', err.response?.data);
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  // Join a ride
  const handleJoin = async (targetRideId) => {
    setJoining(true);
    try {
      await matchApi.joinRide(myRideId, targetRideId);
      setStep('success');
    } catch (err) {
      console.error('Join error:', err);
      alert(err.response?.data?.error || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  // Request to connect to a ride
  const handleRequestConnect = async (candidateRideId) => {
    if (!myRideId) {
      setError('You must post a ride first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await matchApi.requestMatch(myRideId, candidateRideId);
      // Mark the candidate locally as requested
      setMatches((prev) =>
        prev.map((m) =>
          m.candidateRideId === candidateRideId ? { ...m, status: 'PENDING' } : m
        )
      );
    } catch (err) {
      console.error('Request to connect failed', err);
      setError(err.response?.data?.message || 'Failed to request connection');
    } finally {
      setLoading(false);
    }
  };

  // Poll for new matches when waiting
  useEffect(() => {
    if (step === 'waiting' && myRideId) {
      setPolling(true);

      const checkForMatches = async () => {
        try {
          const res = await matchApi.findPotentialMatches(myRideId);
          const foundMatches = res.data || [];
          if (foundMatches.length > 0) {
            setMatches(foundMatches);
            setStep('results');
            if ('vibrate' in navigator) navigator.vibrate(200);
          }
        } catch (err) {
          console.log('Polling error:', err);
        }
      };

      checkForMatches();
      pollIntervalRef.current = setInterval(checkForMatches, 5000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setPolling(false);
      };
    }
  }, [step, myRideId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const destinations = [
    { value: 'LAX', label: 'LAX Airport' },
    { value: 'BUR', label: 'Burbank Airport' },
    { value: 'ONT', label: 'Ontario Airport' },
    { value: 'UNION_STATION', label: 'Union Station' },
  ];

  // Format time
  const formatTime = (iso) => {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // ============ SEARCHING ============
  if (step === 'searching') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cardinal-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 text-xl">Finding rides to {destination.replace('_', ' ')}...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============ RESULTS ============
  if (step === 'results') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-cardinal-red mb-6">
              {matches.length} ride{matches.length > 1 ? 's' : ''} found!
            </h1>

            <div className="space-y-4">
              {matches.map((m) => (
                <div key={m.candidateRideId} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-900">{m.candidateOwnerName}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">From:</span> {m.candidateOrigin}
                        </p>
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">To:</span> {m.candidateDestination?.replace('_', ' ')}
                        </p>
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">Time:</span> {formatTime(m.candidateDepartureTime)}
                        </p>
                      </div>
                      {m.matchScore !== null && m.matchScore !== undefined && (
                        <span className="inline-block mt-3 bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                          {(m.matchScore * 100).toFixed(0)}% match
                        </span>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col items-end space-y-2">
                      <button
                        onClick={() => handleJoin(m.candidateRideId)}
                        disabled={joining || m.status === 'PENDING'}
                        className="bg-cardinal-red text-white px-6 py-2 rounded-md font-medium hover:bg-red-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {joining ? 'Joining...' : m.status === 'PENDING' ? 'Request Sent' : 'Join Ride'}
                      </button>
                      {m.status === 'AVAILABLE' && (
                        <button
                          onClick={() => handleRequestConnect(m.candidateRideId)}
                          className="text-sm text-cardinal-red hover:underline"
                        >
                          Request to Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep('waiting')}
                className="text-gray-600 hover:text-gray-800 underline"
              >
                Skip - keep waiting for better matches
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ WAITING ============
  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="container mx-auto px-4 py-8 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="max-w-md text-center">
            <div className="relative mb-6 inline-block">
              <div className="text-6xl">🔍</div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold text-cardinal-red mb-2">Searching for matches...</h1>
            <p className="text-gray-600 mb-4">
              Your ride to {destination.replace('_', ' ')} is active.
            </p>
            <p className="text-green-600 text-sm mb-8 flex items-center justify-center">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></span>
              Auto-checking every 5 seconds
            </p>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <p className="text-sm text-gray-600">Your ride:</p>
              <p className="font-semibold text-gray-900">{origin} → {destination.replace('_', ' ')}</p>
              <p className="text-sm text-gray-600">{formatTime(datetime)}</p>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              When someone else searches for a ride to the same place,
              you'll both see each other automatically!
            </p>
            <button
              onClick={() => {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                navigate('/rides');
              }}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Cancel and go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ SUCCESS ============
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-green-600 text-white flex items-center justify-center">
        <div className="text-center px-8">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold mb-2">You're matched!</h1>
          <p className="mb-8 opacity-90 max-w-md">
            You've successfully joined a ride.
            Contact your ride partner to coordinate!
          </p>
          <button
            onClick={() => navigate('/rides')}
            className="bg-white text-green-600 px-8 py-3 rounded-md font-bold hover:bg-gray-100 transition"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ============ FORM ============
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-cardinal-red mb-6">Find a Ride Match</h1>

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="USC Village"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination <span className="text-red-500">*</span>
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red"
              >
                {destinations.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Date/Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate('/rides')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !origin.trim() || !datetime}
              className="px-6 py-2 bg-cardinal-red text-white rounded-md hover:bg-red-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Finding...' : 'Find Ride'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
