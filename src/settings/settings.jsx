import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "../components/common_style.css";
import "./settings.css";
import ExportNotes from "../components/ExportNotes.jsx";
import Profile from "./settings_components/profile.jsx";
import About from "./settings_components/about.jsx";
import NotesList from "./settings_components/NotesList.jsx";
import UserGuide from "./settings_components/user_guide.jsx";

function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [popupSize, setPopupSize] = useState("small");
  const [sortOption, setSortOption] = useState("date-desc");
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    chrome.storage.local.get([ "settings"], (result) => {
      if (result.settings !== undefined) {
        setDarkMode(result.settings.darkMode);
        if (result.settings.darkMode) {
          document.body.classList.add("dark-mode");
        }
        if (result.settings.popupSize) setPopupSize(result.settings.popupSize);
        if (result.settings.sortOption) setSortOption(result.settings.sortOption);
      }
    });
  }, []);
  const handleDarkModeChange = (e) => {
    const value = e.target.checked;
    setDarkMode(value);
    chrome.storage.local.get(["settings"], (result) => {
      const updatedSettings = { ...result.settings, darkMode: value };
      chrome.storage.local.set({ settings: updatedSettings });
    });

    if (value) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };
  const handlePopupSizeChange = (e) => {
    const value = e.target.value;
    setPopupSize(value);
    chrome.storage.local.get(["settings"], (result) => {
      const updatedSettings = { ...result.settings, popupSize: value };
      chrome.storage.local.set({ settings: updatedSettings });
    });
  };

  const handleSortOptionChange = (e) => {
    const value = e.target.value;
    setSortOption(value);
    chrome.storage.local.get(["settings"], (result) => {
      const updatedSettings = { ...result.settings, sortOption: value };
      chrome.storage.local.set({ settings: updatedSettings });
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "settings":
        return (
          <div className="card border-1">
            <div className="card-body">
              <div className="mb-4">
                <h6 className="mb-3">Display</h6>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="dark-mode-toggle"
                    checked={darkMode}
                    onChange={handleDarkModeChange}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="dark-mode-toggle"
                  >
                    Enable Dark Mode
                  </label>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label">Popup Size</label>
                <select
                  id="popup-size"
                  className="form-select"
                  value={popupSize}
                  onChange={handlePopupSizeChange}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <hr />

              <div className="mb-4">
                <h6 className="mb-3">General preferences</h6>
                <div className="mb-3">
                  <label className="form-label">Sort Notes</label>
                  <select
                    className="form-select"
                    value={sortOption}
                    onChange={handleSortOptionChange}
                  >
                    <option value="date-desc">Newest to Oldest</option>
                    <option value="date-asc">Oldest to Newest</option>
                    <option value="alpha-asc">A-Z</option>
                    <option value="alpha-desc">Z-A</option>
                  </select>
                </div>
              </div>

              <hr />
              <ExportNotes />
              <div>
                <p className="text-muted mb-3">
                  Help us improve! Your feedback matters.
                </p>
                <a
                  // href="https://docs.google.com/forms/d/e/1FAIpQLSf_257jhT9AKWnVRDjT9EUgUpqgF3Qr2o_V3YchvwshOfXhfA/viewform?usp=sharing"
                  target="_blank"
                  className="btn btn-primary"
                >
                  <i className="fas fa-star me-2"></i>
                  Review Us
                </a>
              </div>
            </div>
          </div>
        );
      case "notes-detail":
        return (
          <NotesList/>
        );
      case "about":
        return (
         <About/>
        );
      case "user-guide":
        return (
          <UserGuide/>
        );
      case "profile":
        return (
          <Profile/>
        );
      default:
        return null;
    }
  };

  return (
    <div className="d-flex">
      <div className="settings-tabs">
        <div className="nav flex-column nav-pills">
          <button
            className={`nav-link ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <i className="fas fa-cog"></i>
            Settings
          </button>
          <button
            className={`nav-link ${
              activeTab === "notes-detail" ? "active" : ""
            }`}
            onClick={() => setActiveTab("notes-detail")}
          >
            <i className="fas fa-sticky-note"></i>
            Notes Detail View
          </button>
          <button
            className={`nav-link ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            <i className="fas fa-info-circle"></i>
            About Us
          </button>
          <button
            className={`nav-link ${activeTab === "user-guide" ? "active" : ""}`}
            onClick={() => setActiveTab("user-guide")}
          >
            <i className="fas fa-question-circle"></i>
            User Guide
          </button>
         
        </div>

        <div
         className={`nav-link profile-section ${activeTab === "profile" ? "active" : ""}`}
         onClick={() => setActiveTab("profile")}
        >
          <i className="fas fa-user-circle"></i>
          Profile
        </div>
      </div>

      <div className="container settings-layout mt-4">
        <h2>
          {activeTab.charAt(0).toUpperCase() +
            activeTab.slice(1).replace("-", " ")}
        </h2>
        {renderTabContent()}
      </div>
    </div>
  );
}

const container = document.getElementById("settings-target");
const root = createRoot(container);
root.render(<Settings />);
