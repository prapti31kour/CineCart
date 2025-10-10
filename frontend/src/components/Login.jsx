// src/components/Login.jsx
import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Login({ handleLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = form;

    try {
      // Admin shortcut: still uses backend to generate token
      if (email === 'admin@example.com' && password === 'admin123') {
        const res = await api.post('/api/auth/login', { email, password });
        const { token, user } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userRole', user.role || 'admin');

        handleLogin && handleLogin(user);
        navigate('/');
        return;
      }

      // Regular user login
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role || 'user');

      if (typeof handleLogin === 'function') handleLogin(user);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md"
        aria-label="Login form"
      >
        <h2 className="text-3xl font-bold mb-8 text-center text-purple-700">
          Login
        </h2>

        <div className="mb-6">
          <label
            htmlFor="email"
            className="block mb-1 font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="input w-full px-4 py-2 border rounded text-gray-900"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="block mb-1 font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="input w-full px-4 py-2 border rounded text-gray-900"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;