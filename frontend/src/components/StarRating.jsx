import React from 'react';

function StarRating({ rating }) {
  const totalStars = 5;
  const filledStars = Math.floor(rating);
  const hasHalfStar = rating - filledStars >= 0.25 && rating - filledStars < 0.75;
  const roundedStars = rating - filledStars >= 0.75 ? filledStars + 1 : filledStars;

  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, index) => {
        let starType;
        if (index < roundedStars) {
          starType = 'full';
        } else if (index === filledStars && hasHalfStar) {
          starType = 'half';
        } else {
          starType = 'empty';
        }

        return (
          <span key={index}>
            {starType === 'full' && (
              <svg
                className="w-5 h-5 text-yellow-400 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            )}
            {starType === 'half' && (
              <svg
                className="w-5 h-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <defs>
                  <linearGradient id={`halfGradient-${index}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#halfGradient-${index})`}
                  stroke="currentColor"
                  d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
                />
              </svg>
            )}
            {starType === 'empty' && (
              <svg
                className="w-5 h-5 text-gray-600 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default StarRating;












// import React from 'react';

// // StarRating Component
// function StarRating({ rating }) {
//     const totalStars = 5;
//     const filledStars = Math.round(rating);

//     return (
//         <div className="flex items-center">
//             {[...Array(totalStars)].map((_, index) => {
//                 const starClass = index < filledStars ? 'text-yellow-400' : 'text-gray-600';
//                 return (
//                     <svg
//                         key={index}
//                         className={`w-5 h-5 fill-current ${starClass}`}
//                         xmlns="http://www.w3.org/2000/svg"
//                         viewBox="0 0 20 20"
//                     >
//                         <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
//                     </svg>
//                 );
//             })}
//         </div>
//     );
// }

// export default StarRating;
