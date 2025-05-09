import React from "react";

const Contributors = () => {
  const contributors = [
    {
      id: 1,
      login: "arjad",
      avatar_url: "https://avatars.githubusercontent.com/u/70262679?v=4",
      html_url: "https://github.com/arjad",
      role: "Software Developer",
      isOwner: true,
    },
    {
      id: 2,
      login: "itsn8k",
      avatar_url: "https://avatars.githubusercontent.com/u/112207116?v=4",
      html_url: "https://github.com/itsn8k",
      role: "Contributor",
    },
    {
      id: 3,
      login: "Abiha0421",
      avatar_url: "https://avatars.githubusercontent.com/u/193497347?v=4",
      html_url: "https://github.com/Abiha0421",
      role: "Student",
    },
    {
      id: 4,
      login: "Dev-Hassaan",
      avatar_url: "https://avatars.githubusercontent.com/u/86980922?v=4",
      html_url: "https://github.com/Dev-Hassaan",
      role: "Contributor",
    },
    {
      id: 5,
      login: "Abdullah-hub498",
      avatar_url: "https://avatars.githubusercontent.com/u/66453712?v=4",
      html_url: "https://github.com/Abdullah-hub498",
      role: "Contributor",
    },
    {
      id: 6,
      login: "ammad-ahmed1",
      avatar_url: "https://avatars.githubusercontent.com/u/63580683?v=4",
      html_url: "https://github.com/ammad-ahmed1",
      role: "Contributor",
    },
    {
      id: 7,
      login: "Mubshr07",
      avatar_url: "https://avatars.githubusercontent.com/u/34352213?v=4",
      html_url: "https://github.com/Mubshr07",
      role: "University Professor",
    },
    {
      id: 8,
      login: "devasjad",
      avatar_url: "https://avatars.githubusercontent.com/u/195527831?v=4",
      html_url: "https://github.com/devasjad",
      role: "Contributor",
    },
    {
      id: 9,
      login: "haffiirfan",
      avatar_url: "https://avatars.githubusercontent.com/u/165992015?v=4",
      html_url: "https://github.com/haffiirfan",
      role: "Contributor",
    },
    {
      id: 10,
      login: "sameer914dev",
      avatar_url: "https://avatars.githubusercontent.com/u/201280561?v=4",
      html_url: "https://github.com/sameer914dev",
      role: "Contributor",
    },
    {
      id: 11,
      login: "sheikh-asjad",
      avatar_url: "https://avatars.githubusercontent.com/u/202496594?v=4",
      html_url: "https://github.com/sheikh-asjad",
      role: "Contributor",
    },
  ];

  return (
    <div className="card-body">
      <h6 className="mb-3">Contributors ( {contributors.length} )</h6>
      <ul className="list-unstyled">
        {contributors.map((contributor) => (
          <li key={contributor.id} className="my-3">
            <div className="d-flex align-items-center">
              <img
                src={contributor.avatar_url}
                width="32"
                className="rounded-circle me-2"
                alt={contributor.login}
              />
              <div>
                <a
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fw-bold text-decoration-none"
                >
                  {contributor.login}
                </a>
                {contributor.isOwner && (
                  <span className="badge bg-primary ms-2">Owner</span>
                )}
                <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                  {contributor.role}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <a
        href="https://github.com/arjad/chrome-notes"
        target="_blank"
        className="btn btn-outline-secondary btn-sm w-100"
      >
        <i className="fab fa-github me-2"></i>
        View on GitHub
      </a>
    </div>
  );
};

export default Contributors;
