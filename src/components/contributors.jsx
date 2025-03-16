import React, { useState, useEffect } from "react";

const Contributrors = ({ notes, onDelete, onUpdate }) => {
  const [contributors, setContributors] = useState([]);

  useEffect(() => {
    fetchContributors();
  }, []);

  const fetchContributors = async () => {
    const repoOwner = "arjad";
    const repoName = "chrome-notes";
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contributors`;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "fetch-contributors-demo"
        },
      });

      if (!response.ok) throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);

      const contributors = await response.json();
      setContributors(contributors);
    } catch (error) {
      console.error("Error fetching contributors:", error);
    }
  };
  return (
    <div className="card">
        <div className="card-body">
        <h6 className="mb-3">Contributors ( {contributors.length} )</h6>
        <div id="contributors-list"></div>

        <ul className="list-group">
            {contributors.length > 0 ? (
            contributors.map((contributor) => (
                <li key={contributor.id} className="list-group-item">
                <a href={contributor.html_url} target="_blank" rel="noopener noreferrer">
                    <img src={contributor.avatar_url} alt={contributor.login} width="24" className="me-2 rounded-circle" />
                    {contributor.login}
                </a>
                </li>
            ))
            ) : (
            <li className="list-group-item">Loading contributors...</li>
            )}
        </ul>

        <a href="https://github.com/arjad/chrome-notes" target="_blank" className="btn btn-outline-secondary btn-sm w-100">
            <i className="fab fa-github me-2"></i>
            View on GitHub
        </a>
        </div>
    </div>
  );
};

export default Contributrors;
