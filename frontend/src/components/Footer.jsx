import React from 'react';

// Footer Component
// - Presents brand + tagline
// - Social media links with hover effects
// - Dynamic year (no hardcoding future years)
// - Accessible (aria-labels for links)
// - Responsive using Tailwind
function Footer() {
  const currentYear = new Date().getFullYear(); // Dynamic copyright

  return (
    <footer className="bg-gray-900 bg-opacity-60 py-8 mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
        
        {/* Brand + tagline */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2">CineCart</h3>
          <p>Your one-stop shop for classic and trending VCDs.</p>
        </div>

        {/* Social media links */}
        <div className="flex justify-center space-x-6 mb-4">
          <a href="#" aria-label="Facebook" className="hover:text-purple-400 transition-colors">Facebook</a>
          <a href="#" aria-label="Twitter" className="hover:text-purple-400 transition-colors">Twitter</a>
          <a href="#" aria-label="Instagram" className="hover:text-purple-400 transition-colors">Instagram</a>
        </div>

        {/* Legal + address */}
        <div>
          <p>&copy; {currentYear} CineCart. All Rights Reserved.</p>
          <p>123 Movie Lane, Cinema City, 530003</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
