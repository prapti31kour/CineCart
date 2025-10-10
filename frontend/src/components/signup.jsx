// src/components/Signup.jsx
import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Signup({ handleLogin }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phoneNumber: '',
    email: '', password: '', role: 'user'
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!/^\d{10}$/.test(form.phoneNumber)) newErrors.phoneNumber = 'Phone number must be 10 digits';
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/.test(form.email)) newErrors.email = 'Email must be lowercase and valid';
    if (form.password.length < 8 || !/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      newErrors.password = 'Password must be 8+ chars and include a special char';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await api.post('/api/auth/signup', form);
      const { token, user } = res.data;
      // persist token + user info
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role || 'user');

      if (typeof handleLogin === 'function') handleLogin(user);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <form onSubmit={handleSubmit} className="bg-gray-800 bg-opacity-60 p-8 rounded-lg w-full max-w-xl">
        <h2 className="text-3xl font-bold mb-8 text-center text-indigo-700">Sign Up</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 font-medium text-gray-700">First Name</label>
            <input name="firstName" type="text" placeholder="sonali" value={form.firstName} onChange={handleChange}
              className="bg-gray-700 w-full p-2 rounded" />
            {errors.firstName && <div className="text-red-500 text-sm">{errors.firstName}</div>}
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Last Name</label>
            <input name="lastName" type="text" placeholder="singh" value={form.lastName} onChange={handleChange}
              className="bg-gray-700 w-full p-2 rounded" />
            {errors.lastName && <div className="text-red-500 text-sm">{errors.lastName}</div>}
          </div>
        </div>

        <div className="mt-6">
          <label className="block mb-1 font-medium text-gray-700">Phone Number</label>
          <input name="phoneNumber" type="tel" placeholder="1234567890" value={form.phoneNumber} onChange={handleChange}
            className="bg-gray-700 w-full p-2 rounded" />
          {errors.phoneNumber && <div className="text-red-500 text-sm">{errors.phoneNumber}</div>}
        </div>

        <div className="mt-6">
          <label className="block mb-1 font-medium text-gray-700">Email</label>
          <input name="email" type="email" placeholder="you@gmail.com" value={form.email} onChange={handleChange}
            className="bg-gray-700 w-full p-2 rounded" />
          {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
        </div>

        <div className="mt-6">
          <label className="block mb-1 font-medium text-gray-700">Password</label>
          <input name="password" type={showPassword ? 'text' : 'password'} placeholder="........" value={form.password}
            onChange={handleChange} className="bg-gray-700 w-full p-2 rounded" />
          {errors.password && <div className="text-red-500 text-sm">{errors.password}</div>}
          <div className="mt-2">
            <label className="text-sm text-gray-300">
              <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="mr-2" />
              Show Password
            </label>
          </div>
        </div>

        <button type="submit" className="w-full mt-8 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
          Create Account
        </button>
      </form>
    </div>
  );
}

export default Signup;