import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize Google Sign-In
    if (window.google) {
      console.log('GOOGLE CLIENT ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      console.log('ORIGIN:', location.origin);
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large' }
      );
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      // Send ID token to backend
      const backendRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        { idToken: response.credential }
      );

      if (backendRes.data && backendRes.data.token) {
        // Store JWT token
        const token = backendRes.data.token;
        localStorage.setItem('authToken', token);

        // Try to decode JWT payload to get user email and id
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.email) localStorage.setItem('userEmail', payload.email);
            if (payload.sub) localStorage.setItem('userId', payload.sub);
          }
        } catch (e) {
          // ignore decode errors
        }

        navigate('/rides');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Authentication failed. Please try again.';
      setError(msg);
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

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <div
            id="google-signin-button"
            className="flex justify-center"
          ></div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Sign in with your USC Google account (@usc.edu)</p>
          <p className="mt-2">Your account will be verified by Google.</p>
        </div>

        {loading && (
          <div className="mt-4 text-center text-gray-600">
            Signing in...
          </div>
        )}
      </div>
    </div>
  );
}

