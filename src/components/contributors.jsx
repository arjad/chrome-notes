import React, { useState, useEffect } from "react";

const Contributors = ({ notes, onDelete, onUpdate }) => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-body">
      <h6 className="mb-3">Contributors ( {contributors.length} )</h6>
      {loading ? (
        <div className="text-center py-4">
          <img src="https://i.gifer.com/ZZ5H.gif" alt="Loading..." width="50" />
          <p>Loading contributors...</p>
        </div>
      ) : (
        <ul className="list-unstyled">
          {contributors.length > 0 ? (
            contributors.map((contributor) => (
              <li key={contributor.id} className="my-2">
                <img src={contributor.avatar_url} width="24" className="rounded-circle m-2" alt={contributor.login} />
                <a href={contributor.html_url} target="_blank" rel="noopener noreferrer">
                  {contributor.login}
                </a>
              </li>
            ))
          ) : (
            <div className="text-center py-4">
              <i class="fa-solid fa-spinner"></i>
              <h5>Contributors</h5>
              <p className="text-muted">Loading contributors...</p>
            </div>
          )}
        </ul>
      )}

      <a href="https://github.com/arjad/chrome-notes" target="_blank" className="btn btn-outline-secondary btn-sm w-100">
        <i className="fab fa-github me-2"></i>
        View on GitHub
      </a>
    </div>
  );
};

export default Contributors;