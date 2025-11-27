import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Validate USC email
    if (!email.endsWith('@usc.edu')) {
      setError('Please use your USC email (@usc.edu)');
      return;
    }

    // TODO: Implement actual Google OAuth
    // For now, mock login for development
    // Generate a mock UUID if one doesn't exist
    let userId = localStorage.getItem('userId');
    if (!userId || userId === 'test-user-id') {
      // Generate a valid UUID v4
      userId = 'a0a0a0a0-1111-2222-3333-444444444444';
    }

    localStorage.setItem('userEmail', email);
    localStorage.setItem('userId', userId); // Mock user ID (valid UUID)
    localStorage.setItem('authToken', 'mock-token'); // Mock token

    navigate('/rides');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cardinal-red to-red-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cardinal-red mb-2">Trojan Rides</h1>
          <p className="text-gray-600">USC Rideshare Platform</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign in</h2>
          <p className="text-gray-600 text-sm">USC emails only</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (simulates Google SSO)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tommy.trojan@usc.edu"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cardinal-red"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll verify that your email ends with @usc.edu
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-cardinal-red text-white py-3 rounded-md font-medium hover:bg-red-800 transition"
          >
            Sign in with Google
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Note: This is a development mock.</p>
          <p>In production, real Google OAuth will be used.</p>
        </div>
      </div>
    </div>
  );
}
