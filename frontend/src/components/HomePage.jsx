import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';

/**
 * HomePage.jsx
 * - Loads VCDs and renders three category rows (Hollywood, Bollywood, Regional)
 * - Each category is a horizontally scrollable "carousel" (Netflix-like)
 * - Left/Right arrow buttons scroll the row by 90% of the visible width
 * - Uses CSS scroll-snap for nicer snapping behavior and keyboard accessibility
 */

function ScrollRow({ title, items, onAddToCart, userEmail }) {
  const scrollerRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      setShowLeft(el.scrollLeft > 8);
      // showRight if there's overflow to the right (allow small epsilon)
      setShowRight(el.scrollLeft + el.clientWidth + 8 < el.scrollWidth);
    };

    update();
    el.addEventListener('scroll', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [items.length]);

  const scrollBy = (dir = 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // keyboard accessibility: left/right arrow when focused on scroller
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollBy(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollBy(-1);
    }
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title} <span className="text-indigo-300 text-lg ml-2">({items.length})</span></h2>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => scrollBy(-1)}
            disabled={!showLeft}
            aria-label={`Scroll ${title} left`}
            className={`p-2 rounded-full shadow-lg focus:outline-none transition disabled:opacity-40 disabled:cursor-not-allowed bg-gray-800 bg-opacity-60`}
            title="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => scrollBy(1)}
            disabled={!showRight}
            aria-label={`Scroll ${title} right`}
            className={`p-2 rounded-full shadow-lg focus:outline-none transition disabled:opacity-40 disabled:cursor-not-allowed bg-gray-800 bg-opacity-60`}
            title="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="list"
        aria-label={`${title} carousel`}
        className="flex space-x-4 overflow-x-auto no-scrollbar py-2 px-1"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((movie) => (
          <div
            key={movie.vcdID}
            role="listitem"
            style={{ scrollSnapAlign: 'start', minWidth: 220, maxWidth: 260 }}
            className="flex-shrink-0"
          >
            <MovieCard
              movie={movie}
              onAddToCart={onAddToCart}
              userEmail={userEmail}
              quantity={movie.quantity}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function HomePage({ onAddToCart, searchTerm = '', userEmail, token }) {
  const [movies, setMovies] = useState({ Hollywood: [], Bollywood: [], Regional: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const savedEmail = (userEmail || localStorage.getItem('userEmail') || '').trim();

  useEffect(() => {
    let mounted = true;
    axios.get('http://localhost:5000/api/vcds', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
      .then(response => {
        if (!mounted) return;
        const categorized = { Hollywood: [], Bollywood: [], Regional: [] };
        response.data.forEach(vcd => {
          const movie = {
            vcdID: vcd.vcdID,
            title: vcd.vcdName,
            price: vcd.cost,
            rating: vcd.rating,
            image: vcd.vcdImage,
            quantity: vcd.quantity,
            category: vcd.category
          };
          if (categorized[vcd.category]) categorized[vcd.category].push(movie);
        });
        setMovies(categorized);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching VCDs:', err);
        setError('Could not load movie data. Please try again later.');
        setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [token]);

  const allMovies = useMemo(
    () => [...movies.Hollywood, ...movies.Bollywood, ...movies.Regional],
    [movies]
  );

  const trimmed = (searchTerm || '').trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!trimmed) return [];
    return allMovies.filter(m => (m.title || '').toLowerCase().includes(trimmed));
  }, [allMovies, trimmed]);

  if (isLoading) return <div className="text-center py-20">Loading movies...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  const showSearch = trimmed.length > 0;

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center px-4">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=1931&q=80')",
            filter: 'blur(3px) brightness(0.4)'
          }}
        />
        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Discover Classics & Trending VCDs
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Relive the golden era of cinema. High-quality VCDs delivered right to your doorstep.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {showSearch ? (
          <>
            <h2 className="text-3xl font-bold mb-6 border-l-4 border-indigo-500 pl-4">
              Search Results ({searchResults.length})
            </h2>
            {searchResults.length === 0 ? (
              <div className="text-gray-400">No matches for “{searchTerm}”.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchResults.map(movie => (
                  <MovieCard
                    key={movie.vcdID}
                    movie={movie}
                    onAddToCart={onAddToCart}
                    userEmail={savedEmail}
                    quantity={movie.quantity}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <ScrollRow
              title="Hollywood"
              items={movies.Hollywood}
              onAddToCart={onAddToCart}
              userEmail={savedEmail}
            />

            <ScrollRow
              title="Bollywood"
              items={movies.Bollywood}
              onAddToCart={onAddToCart}
              userEmail={savedEmail}
            />

            <ScrollRow
              title="Regional Gems"
              items={movies.Regional}
              onAddToCart={onAddToCart}
              userEmail={savedEmail}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;























// import React, { useState, useEffect, useMemo } from 'react';
// import axios from 'axios';
// import MovieCard from '../components/MovieCard';

// function HomePage({ onAddToCart, searchTerm = '', userEmail, token }) {
//   const [movies, setMovies] = useState({ Hollywood: [], Bollywood: [], Regional: [] });
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const savedEmail = (userEmail || localStorage.getItem('userEmail') || '').trim();

//   useEffect(() => {
//     let mounted = true;
//     axios.get('http://localhost:5000/api/vcds', {
//       headers: token ? { Authorization: `Bearer ${token}` } : undefined
//     })
//       .then(response => {
//         if (!mounted) return;
//         const categorized = { Hollywood: [], Bollywood: [], Regional: [] };
//         response.data.forEach(vcd => {
//           const movie = {
//             vcdID: vcd.vcdID,
//             title: vcd.vcdName,
//             price: vcd.cost,
//             rating: vcd.rating,
//             image: vcd.vcdImage,
//             quantity: vcd.quantity,
//             category: vcd.category
//           };
//           if (categorized[vcd.category]) categorized[vcd.category].push(movie);
//         });
//         setMovies(categorized);
//         setIsLoading(false);
//       })
//       .catch(err => {
//         console.error('Error fetching VCDs:', err);
//         setError('Could not load movie data. Please try again later.');
//         setIsLoading(false);
//       });
//     return () => { mounted = false; };
//   }, [token]);

//   const allMovies = useMemo(
//     () => [...movies.Hollywood, ...movies.Bollywood, ...movies.Regional],
//     [movies]
//   );

//   const trimmed = (searchTerm || '').trim().toLowerCase();
//   const searchResults = useMemo(() => {
//     if (!trimmed) return [];
//     return allMovies.filter(m => (m.title || '').toLowerCase().includes(trimmed));
//   }, [allMovies, trimmed]);

//   if (isLoading) return <div className="text-center py-20">Loading movies...</div>;
//   if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

//   const showSearch = trimmed.length > 0;

//   return (
//     <div>
//       {/* Hero */}
//       <div className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center px-4">
//         <div
//           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//           style={{
//             backgroundImage: "url('https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=1931&q=80')",
//             filter: 'blur(3px) brightness(0.4)'
//           }}
//         />
//         <div className="relative z-10">
//           <h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
//             Discover Classics & Trending VCDs
//           </h1>
//           <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
//             Relive the golden era of cinema. High-quality VCDs delivered right to your doorstep.
//           </p>
//         </div>
//       </div>

//       {/* Body */}
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
//         {showSearch ? (
//           <>
//             <h2 className="text-3xl font-bold mb-6 border-l-4 border-indigo-500 pl-4">
//               Search Results ({searchResults.length})
//             </h2>
//             {searchResults.length === 0 ? (
//               <div className="text-gray-400">No matches for “{searchTerm}”.</div>
//             ) : (
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {searchResults.map(movie => (
//                   <MovieCard
//                     key={movie.vcdID}
//                     movie={movie}
//                     onAddToCart={onAddToCart}
//                     userEmail={savedEmail}
//                     quantity={movie.quantity}
//                   />
//                 ))}
//               </div>
//             )}
//           </>
//         ) : (
//           <>
//             {/* Hollywood */}
//             <section className="mb-12">
//               <h2 className="text-3xl font-bold mb-6 border-l-4 border-purple-500 pl-4">Hollywood</h2>
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {movies.Hollywood.map(movie => (
//                   <MovieCard
//                     key={movie.vcdID}
//                     movie={movie}
//                     onAddToCart={onAddToCart}
//                     userEmail={savedEmail}
//                     quantity={movie.quantity}
//                   />
//                 ))}
//               </div>
//             </section>

//             {/* Bollywood */}
//             <section className="mb-12">
//               <h2 className="text-3xl font-bold mb-6 border-l-4 border-pink-500 pl-4">Bollywood</h2>
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {movies.Bollywood.map(movie => (
//                   <MovieCard
//                     key={movie.vcdID}
//                     movie={movie}
//                     onAddToCart={onAddToCart}
//                     userEmail={savedEmail}
//                     quantity={movie.quantity}
//                   />
//                 ))}
//               </div>
//             </section>

//             {/* Regional */}
//             <section>
//               <h2 className="text-3xl font-bold mb-6 border-l-4 border-teal-400 pl-4">Regional Gems</h2>
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                 {movies.Regional.map(movie => (
//                   <MovieCard
//                     key={movie.vcdID}
//                     movie={movie}
//                     onAddToCart={onAddToCart}
//                     userEmail={savedEmail}
//                     quantity={movie.quantity}
//                   />
//                 ))}
//               </div>
//             </section>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default HomePage;