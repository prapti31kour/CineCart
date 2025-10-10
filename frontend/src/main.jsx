import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MovieDetails from './components/MovieDetails.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* <MovieDetails/> */}
  </StrictMode>,
)
