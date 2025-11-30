import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email.endsWith('@usc.edu')) {
      setError('Use your USC email (@usc.edu)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const firstName = email.split('@')[0].split(/[._]/)[0];
      const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);

      const res = await apiClient.post('/api/users/login', {
        email,
        firstName: name,
      });

      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', res.data.firstName);
      localStorage.setItem('authToken', 'token');

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          🚗 Trojan Rides
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.name@usc.edu"
            className="w-full bg-gray-800 text-white px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white"
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-gray-500 text-center text-sm mt-6">
          USC students only
        </p>

        <div className="mt-8 p-4 bg-gray-900 rounded-xl">
          <p className="text-gray-400 text-xs text-center">
            Test with: <code className="text-white">alice@usc.edu</code> or <code className="text-white">bob@usc.edu</code>
          </p>
        </div>
      </div>
    </div>
  );
}
