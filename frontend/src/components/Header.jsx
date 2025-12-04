import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || 'user@usc.edu';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  return (
    <header className="bg-cardinal-red text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1
            className="text-2xl font-bold cursor-pointer"
            onClick={() => navigate('/rides')}
          >
            Trojan Rides
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/rides/new')}
            className="bg-white text-cardinal-red px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition"
          >
            Post a Ride
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-cardinal-red font-bold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline">{userEmail}</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm hover:underline"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
