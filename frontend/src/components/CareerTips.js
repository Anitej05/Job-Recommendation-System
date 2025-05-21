// src/components/CareerTips.js

import React, { useEffect, useState } from 'react';

const sectors = [
  'General',
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Marketing'
];

function CareerTips() {
  const [tips, setTips]       = useState([]);   // [{ title, description }]
  const [loading, setLoading] = useState(false);
  const [sector, setSector]   = useState('General');
  const [error, setError]     = useState(null);

  useEffect(() => {
    async function fetchTips() {
      setLoading(true);
      setError(null);

      try {
        const base = 'http://localhost:8000/market-trends';
        const url  = sector === 'General'
          ? base
          : `${base}?sector=${encodeURIComponent(sector)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const { market_trends } = await res.json();

        if (Array.isArray(market_trends)) {
          // Assuming each item in market_trends has 'title' and 'description'
          setTips(market_trends);
        } else {
          // Handle the case where market_trends is not an array or is empty
          // The backend might return an object like { market_trends: [] } or { message: "No trends found" }
          // If it's not an array, treat it as no data
          if (market_trends && typeof market_trends === 'object' && Array.isArray(market_trends.market_trends)) {
             setTips(market_trends.market_trends); // Handle potential nested structure
          } else {
             setTips([]); // Ensure it's always an array for mapping
             console.warn("Backend response for market trends is not a valid array:", market_trends);
             // Optionally set a specific "No tips found" message here if needed
          }
        }
      } catch (err) {
        console.error("Failed to fetch tips:", err);
        setError("Unable to fetch market trends. Please try again later.");
        setTips([]); // Clear any old tips on error
      } finally {
        setLoading(false);
      }
    }

    fetchTips();
  }, [sector]); // Dependency array: re-run effect when sector changes

  // Optional: Add a message when no tips are found
  const noTipsMessage = !loading && !error && tips.length === 0 && "No career tips available for the selected sector.";


  return (
    <div className="career-tips-container">
      <h2>Career Tips & Market Trends</h2>

      {/* Use a div with a class for styling the selector */}
      <div className="sector-selector">
        <label htmlFor="sector-select">Select a sector:</label>
        {/* Use a class for styling the select element */}
        <select
          id="sector-select"
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="sector-select" // Add class here
        >
          {sectors.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading && <p className="loading-message">Loading tips...</p>}
      {error   && <p className="error-message">{error}</p>} {/* Use error-message class */}
      {noTipsMessage && <p className="no-results-message">{noTipsMessage}</p>} {/* Use no-results class */}


      {!loading && !error && tips.length > 0 && (
        <div className="jobs-grid"> {/* Reuse jobs-grid class for layout */}
          {tips.map((tip, idx) => (
            <div className="job-card" key={idx}> {/* Reuse job-card class for card styling */}
              {/* Wrap content in job-card-content to apply padding etc. */}
              <div className="job-card-content">
                 <h3>{tip.title}</h3>
                 {/* Reuse job-card-description class for consistent text style */}
                 <p className="job-card-description">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CareerTips;