import React, { useEffect, useState } from "react";

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);

  const loadUser = () => {
    chrome.storage.local.get(["userProfile"], (result) => {
      if (result.userProfile) {
        setUserProfile(result.userProfile);
      }
    });
  };

  useEffect(() => {
    loadUser();

    const listener = (message, sender, sendResponse) => {
      if (message.action === "refreshPopup") {
        loadUser();
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleLogin = () => {
    chrome.runtime.sendMessage({ action: "startGoogleLogin" });
  };

  const handleLogout = () => {
    chrome.storage.local.remove("userProfile", () => {
      setUserProfile(null);
    });
  };

  return (
    <div className="card">
      <div className="card-body">
        {userProfile ? (
          <div className="text-center">
            <img
              src={userProfile.picture}
              alt="User"
              className="rounded-circle mb-2"
              width="80"
              height="80"
            />
            <h5 className="mb-1">{userProfile.name}</h5>
            <p className="text-muted">{userProfile.email}</p>

            <div className="d-flex align-items-center gap-3 mb-4 justify-content-center">
              <div className="premium-badge">PREMIUM</div>
              <span className="text-muted">Active until Dec 2024</span>
            </div>

            <button className="btn btn-outline-secondary mt-4" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="fas fa-crown text-warning mb-3"></i>
            <h5>Login to Access Premium Features</h5>
            <p className="text-muted">Sign in with your Google account</p>
            <button className="btn btn-primary" onClick={handleLogin}>
              <i className="fab fa-google me-2"></i>
              Login with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
