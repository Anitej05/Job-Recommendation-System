import React, { useState, useEffect } from 'react'; // Added useEffect for potential future use

function Recommendations() {
  const [preferences, setPreferences] = useState('');
  const [skills, setSkills] = useState('');
  const [detailedExpectations, setDetailedExpectations] = useState(''); // New state
  const [jobResults, setJobResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState(false); // To show "no results" only after a submission

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setJobResults([]);
    setLoading(true);
    setSubmittedQuery(true); // Mark that a query has been submitted

    const payload = {
      preferences,
      skills,
      detailed_expectations: detailedExpectations, // Send new field
    };

    try {
      // const response = await fetch('http://localhost:8000/recommendations', {
      // Use environment variable for API URL if available, otherwise fallback
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If response is not JSON, use status text or generic message
          throw new Error(response.statusText || `Request failed with status ${response.status}`);
        }
        throw new Error(errorData.detail || `API Error: Status ${response.status}`);
      }

      const data = await response.json();
      // Ensure data.recommendations is an array, even if API returns null or undefined
      setJobResults(Array.isArray(data.recommendations) ? data.recommendations : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || 'Failed to fetch recommendations. Please check the console and try again.');
    } finally {
      setLoading(false);
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text || typeof text !== 'string') return 'No description provided.';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  };

  return (
    <div className="recommendations-container">
      <h2>Job Recommendations</h2>
      <p className="page-subtitle">
        Tell us your preferences, skills, and detailed expectations to find jobs tailored to you.
        The more details you provide, the better the match!
      </p>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="form-container">
        <div>
          <label htmlFor="preferences-input">General Preferences:</label>
          <input
            id="preferences-input"
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="E.g., Remote, Full-time, San Francisco"
          />
        </div>

        <div>
          <label htmlFor="skills-input">Your Key Skills:</label>
          <input
            id="skills-input"
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="E.g., React, Node.js, Python, Project Management"
          />
        </div>

        <div>
          <label htmlFor="detailed-expectations-input">Detailed Expectations (Optional):</label>
          <textarea
            id="detailed-expectations-input"
            value={detailedExpectations}
            onChange={(e) => setDetailedExpectations(e.target.value)}
            placeholder="Describe your ideal role: e.g., desired salary, work environment (collaborative, fast-paced), company culture (innovative, mission-driven), career growth opportunities, deal-breakers..."
            rows="5" // Increased rows for more space
            className="detailed-expectations-textarea"
          />
           <small>The more you tell us, the better we can match you to your dream job!</small>
        </div>


        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Searching for Jobs…' : 'Get Personalized Recommendations'}
        </button>
      </form>

      {loading && <p className="loading-message">Fetching personalized recommendations based on your input...</p>}

      {!loading && submittedQuery && jobResults.length === 0 && !error && (
        <p className="no-results-message">
          No recommendations found matching your criteria. Try adjusting your preferences, skills, or detailed expectations.
        </p>
      )}

      {jobResults.length > 0 && (
        <div className="jobs-grid">
          {jobResults.map((job, index) => (
            <div key={job.url || index} className="job-card"> {/* Use job.url as key if available and unique */}
              {job.logo && ( // Assuming logo might be added later by LLM or other means
                <div className="job-card-logo">
                  <img src={job.logo} alt={`${job.company || 'Company'} logo`} />
                </div>
              )}
              <div className="job-card-content">
                <h3>{job.title || 'Untitled Position'}</h3>
                <p className="job-company">
                  <strong>Company:</strong> {job.company || 'Unknown Company'}
                </p>
                {/* Location is not explicitly returned, but could be in title/desc */}
                {/* <p className="job-location"><strong>Location:</strong> {job.location || 'Not specified'}</p> */}

                {job.relevance_notes && (
                  <div className="job-relevance-notes">
                    <p><strong>Why it might be a fit:</strong> {job.relevance_notes}</p>
                  </div>
                )}

                <div className="job-card-description">
                  <p>{truncateText(job.short_description, 180)}</p>
                </div>

                {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
                  <div className="job-skills">
                    <strong>Key Skills Mentioned: </strong>
                    {job.skills.map((skill, idx) => (
                      <span key={idx} className="skill-badge">{skill}</span>
                    ))}
                  </div>
                )}

                {job.url && (
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-link">
                    View Full Posting
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recommendations;