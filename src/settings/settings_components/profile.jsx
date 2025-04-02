import React, { useState } from "react";

const Profile = () => {
  const [isPremium, setIsPremium] = useState(false);
  
  return (
    <div className="card">
      <div className="card-body">
        {isPremium ? (
          <div>
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="premium-badge">PREMIUM</div>
              <span className="text-muted">Active until Dec 2024</span>
            </div>

            <h6 className="mb-3">Premium Features</h6>
            <div className="list-group list-group-flush">
              <div className="list-group-item border-0">
                <i className="fas fa-check text-success me-2"></i>
                Unlimited Notes
              </div>
              <div className="list-group-item border-0">
                <i className="fas fa-check text-success me-2"></i>
                Cloud Sync
              </div>
              <div className="list-group-item border-0">
                <i className="fas fa-check text-success me-2"></i>
                Advanced Formatting
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <i
              className="fas fa-crown text-warning mb-3"
            ></i>
            <h5>Upgrade to Premium</h5>
            <p className="text-muted">
              Will be available soon
            </p>
            <button className="btn disabled">
              <i className="fas fa-arrow-up me-2"></i>
              Upgrade Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
