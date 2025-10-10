
import React from 'react';

import { Link, useNavigate } from 'react-router-dom';

/**
 * Navbar.jsx
 * - Displays brand, search bar, cart, login/signup or logout/dashboard
 * - Role-aware: shows dashboard button for admin
 * - Manages session via localStorage + props
 */
function Navbar({ cartCount, user, handleLogout, searchTerm, onSearchChange }) {
  const navigate = useNavigate();

  // Derive session state from props OR localStorage
  const role = user?.role ?? localStorage.getItem('userRole');
  const loggedIn = !!user || !!localStorage.getItem('userEmail');

  const onDashboard = () => navigate('/dashboard');

  // Clear all persisted session keys
  const onLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.setItem('userEmail', ''); // optional: explicitly empty
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminPassword');

    handleLogout?.(); // clear state in parent
    navigate('/');
  };

  return (
    <header className="bg-gray-900 bg-opacity-30 backdrop-blur-lg sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo / Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <svg
                className="w-10 h-10 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="text-2xl font-bold text-white">CineCart</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative text-gray-400 focus-within:text-gray-100">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search movies..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search movies"
              />
            </div>
          </div>

          {/* Right Section: Cart + Auth */}
          <div className="flex items-center space-x-4">

            {/* Cart */}
            {/* <Link
              to="/cart"
              className="relative text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="View Cart"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0
                   0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link> */}
            

            <Link
              to="/cart"
              className="relative text-gray-300 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="View Cart"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0
                  0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </Link>


            {/* Order History */}
              {loggedIn && (
                <button
                  onClick={() => navigate('/orders')}
                  className="relative p-2 rounded-full hover:bg-gray-700 transition-colors"
                  aria-label="View Order History"
                >
                  <img
                    src="data:image/jpeg;base64,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"
                    alt="Order History"
                    className="w-6 h-6"
                  />
                </button>
              )}


            {/* Auth Links */}
            {loggedIn ? (
              <>
                {role === 'admin' && (
                  <button
                    onClick={onDashboard}
                    className="flex items-center space-x-2 bg-yellow-500 text-black font-semibold py-2 px-4 rounded-full hover:bg-yellow-600 transition-all"
                  >
                    <span>Dashboard</span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 bg-transparent text-gray-300 py-2 px-4 border border-gray-600 rounded-full hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-2 bg-transparent text-gray-300 py-2 px-4 border border-gray-600 rounded-full hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
