import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import api from '../services/api';
import Alert from '../components/Alert';

function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    const loadMatchDetails = async () => {
      try {
        const response = await api.get(`/api/matches/${matchId}`);
        const matchData = response.data;

        // TODO: Add status check once match status values are confirmed
        // For now, allow chat for any match

        setMatch(matchData);

        const isRide1Owner = matchData.ride1.user.userId === currentUserId;
        const otherUserData = isRide1Owner ? matchData.ride2.user : matchData.ride1.user;
        setOtherUser(otherUserData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading match:', err);
        setError('Failed to load match details');
        setLoading(false);
      }
    };

    if (matchId && currentUserId) {
      loadMatchDetails();
    }
  }, [matchId, currentUserId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-xl">Loading chat...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert type="error" message={error} />
        <button
          onClick={() => navigate('/matches')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Matches
        </button>
      </div>
    );
  }

  if (!match || !otherUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert type="error" message="Match not found" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-red-600 hover:text-red-700 flex items-center gap-2"
        >
          <span>&larr;</span> Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Match Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Destination:</span>
            <span className="ml-2 font-medium">{match.ride1.destination}</span>
          </div>
          <div>
            <span className="text-gray-600">Status:</span>
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded">
              {match.status}
            </span>
          </div>
        </div>
      </div>

      <ChatWindow
        matchId={matchId}
        currentUserId={currentUserId}
        otherUserName={`${otherUser.firstName} ${otherUser.lastName}`}
      />
    </div>
  );
}

export default Chat;
