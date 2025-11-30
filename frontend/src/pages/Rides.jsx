import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { rideApi, matchApi } from '../services/api';

export default function Rides() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Trojan';
  
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
            // Play a sound or vibrate
            if ('vibrate' in navigator) navigator.vibrate(200);
          }
        } catch (err) {
          console.log('Polling error:', err);
        }
      };

      // Check immediately
      checkForMatches();
      
      // Then check every 5 seconds
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
    { value: 'LAX', label: '✈️ LAX Airport' },
    { value: 'BUR', label: '✈️ Burbank Airport' },
    { value: 'ONT', label: '✈️ Ontario Airport' },
    { value: 'UNION_STATION', label: '🚂 Union Station' },
  ];

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!origin.trim() || !datetime) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);
    setStep('searching');

    try {
      // 1. Create ride
      const rideRes = await rideApi.createRide({
        originLocation: origin,
        destination: destination,
        departureDatetime: new Date(datetime).toISOString(),
        maxPassengers: 2,
        costSplitPreference: 'EQUAL',
        flexibleTime: true,
        timeFlexibilityMinutes: 60,
        notes: '',
      });

      const rideId = rideRes.data.rideId;
      setMyRideId(rideId);

      // 2. Find matches
      const matchRes = await matchApi.findPotentialMatches(rideId);
      const foundMatches = matchRes.data || [];
      setMatches(foundMatches);

      // 3. Show results
      if (foundMatches.length > 0) {
        setStep('results');
      } else {
        setStep('waiting');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Something went wrong');
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
      alert(err.response?.data?.error || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Finding rides to {destination}...</p>
        </div>
      </div>
    );
  }

  // ============ RESULTS ============
  if (step === 'results') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">🎉 {matches.length} ride{matches.length > 1 ? 's' : ''} found!</h1>
        </div>
        
        <div className="p-4 space-y-4">
          {matches.map((m) => (
            <div key={m.candidateRideId} className="bg-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">{m.candidateOwnerName}</p>
                  <p className="text-gray-400 text-sm">From: {m.candidateOrigin}</p>
                  <p className="text-gray-400 text-sm">To: {m.candidateDestination?.replace('_', ' ')}</p>
                  <p className="text-gray-400 text-sm">{formatTime(m.candidateDepartureTime)}</p>
                  {m.matchScore && (
                    <span className="inline-block mt-2 bg-green-600 text-xs px-2 py-1 rounded">
                      {m.matchScore.toFixed(0)}% match
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleJoin(m.candidateRideId)}
                  disabled={joining}
                  className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50"
                >
                  {joining ? '...' : 'Join'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4">
          <button
            onClick={() => setStep('waiting')}
            className="w-full text-gray-400 py-3"
          >
            Skip - keep waiting for better matches
          </button>
        </div>
      </div>
    );
  }

  // ============ WAITING ============
  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <div className="relative mb-6">
          <div className="text-6xl">🔍</div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Searching for matches...</h1>
        <p className="text-gray-400 text-center mb-4">
          Your ride to {destination.replace('_', ' ')} is active.
        </p>
        <p className="text-green-400 text-sm mb-8 flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          Auto-checking every 5 seconds
        </p>
        <div className="bg-gray-800 rounded-xl p-4 w-full max-w-sm mb-6">
          <p className="text-sm text-gray-400">Your ride:</p>
          <p className="font-semibold">{origin} → {destination.replace('_', ' ')}</p>
          <p className="text-sm text-gray-400">{formatTime(datetime)}</p>
        </div>
        <p className="text-gray-500 text-sm text-center mb-4">
          When someone else searches for a ride to the same place,<br/>
          you'll both see each other automatically!
        </p>
        <button
          onClick={() => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStep('form');
            setMyRideId(null);
          }}
          className="text-gray-400 underline"
        >
          Cancel and go back
        </button>
      </div>
    );
  }

  // ============ SUCCESS ============
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-green-600 text-white flex flex-col items-center justify-center p-8">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold mb-2">You're matched!</h1>
        <p className="text-center mb-8 opacity-90">
          You've successfully joined a ride.<br/>
          Contact your ride partner to coordinate!
        </p>
        <button
          onClick={() => {
            setStep('form');
            setMyRideId(null);
            setOrigin('');
            setDatetime('');
          }}
          className="bg-white text-green-600 px-8 py-3 rounded-lg font-bold"
        >
          Done
        </button>
      </div>
    );
  }

  // ============ FORM ============
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold">🚗 Trojan Rides</h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-400">{userName}</span>
          <button onClick={handleLogout} className="text-gray-500 text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-3xl font-bold mb-8">Where to?</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origin */}
          <div>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Pickup location (e.g., USC Village)"
              className="w-full bg-gray-800 text-white px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          {/* Destination */}
          <div>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white appearance-none"
            >
              {destinations.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Date/Time */}
          <div>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full bg-gray-800 text-white px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Finding...' : 'Find Ride'}
          </button>
        </form>
      </div>
    </div>
  );
}
