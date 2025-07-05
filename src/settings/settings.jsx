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
  const [darkMode, setDarkMode] = useState();
  const [detailedView, setDetailedView] = useState(false);
  const [popupSize, setPopupSize] = useState("small");
  const [sortOption, setSortOption] = useState("date-desc");
  const [activeTab, setActiveTab] = useState("settings");
  const [hideSortNotes, setHideSortNotes] = useState(false);


  useEffect(() => {
    chrome.storage.local.get([ "settings"], (result) => {
      if (result.settings !== undefined) {
        setDarkMode(result.settings.darkMode);
        setDetailedView(result.settings.detailedView);
        if (result.settings.darkMode == "dark" || (result.settings.darkMode == "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
          document.body.classList.add("dark-mode");
        }
        if (result.settings.popupSize) setPopupSize(result.settings.popupSize);
        if (result.settings.sortOption) setSortOption(result.settings.sortOption);
        if (result.settings.hideSortNotes) setHideSortNotes(result.settings.hideSortNotes || false);
      }
    });
  }, []);
  const handleDarkModeChange = (value) => {
    setDarkMode(value);
    chrome.storage.local.get(["settings"], (result) => {
      const updatedSettings = { ...result.settings, darkMode: value };
      chrome.storage.local.set({ settings: updatedSettings });
    });

    document.body.classList.remove("dark-mode", "light-mode");
    if (value === "dark") {
      document.body.classList.add("dark-mode");
    } else if (value === "light") {
      document.body.classList.add("light-mode");
    } else if (value === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.classList.add(prefersDark ? "dark-mode" : "light-mode");
  
      // Optional: Add listener to update on system theme change
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        document.body.classList.remove("dark-mode", "light-mode");
        document.body.classList.add(e.matches ? "dark-mode" : "light-mode");
      });
    }
  };

  const handleDetailedViewChange = (value) => {
    setDetailedView(value);
    chrome.storage.local.get(["settings"], (result) => {
      const updatedSettings = { ...result.settings, detailedView: value };
      chrome.storage.local.set({ settings: updatedSettings });
    });
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

  const handleHideSideNotes = (e) => {
    const value = e.target.value === "true"; // convert string to boolean
    setHideSortNotes(value);
  
    chrome.storage.local.get(["settings"], (result) => {
      const settings = result.settings || {};
      settings.hideSortNotes = value; // ✅ camelCase
      chrome.storage.local.set({ settings });
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
                <div className="form-check form-switch theme-toggle mt-3 mb-3">
                  <h6 className="mb-2">Choose Theme</h6>
                  <div className="theme-icons d-flex gap-3">
                    <div>
                      <img
                        src="../assets/light.png"
                        alt="Light Mode"
                        className={`theme-icon ${darkMode == "light" ? "active" : ""}`}
                        onClick={() => handleDarkModeChange("light")}
                      />
                      <p> Light Mode </p>
                    </div>
                    <div>
                      <img
                        src="../assets/dark.png"
                        alt="Dark Mode"
                        className={`theme-icon ${darkMode == "dark" ? "active" : ""}`}
                        onClick={() => handleDarkModeChange("dark")}
                      />
                      <p>Dark Mode</p>
                    </div>
                    <div>
                      <img
                        src="../assets/system.png"
                        alt="System Mode"
                        className={`theme-icon ${darkMode == "system" ? "active" : ""}`}
                        onClick={() => handleDarkModeChange("system")}
                      />
                      <p>System Mode</p>
                    </div>
                  </div>
                </div>
             
                <div className="form-check form-switch theme-toggle mt-3 mb-3">
                  <h6 className="mb-2">Choose Views Type</h6>
                  <div className="theme-icons d-flex gap-3">
                    <img
                      src="../assets/simple.png"
                      alt="Simple View"
                      className={`theme-icon ${!detailedView ? "active" : ""}`}
                      onClick={() => handleDetailedViewChange(false)}
                    />
                    <img
                      src="../assets/detailed.png"
                      alt="Detailed View"
                      className={`theme-icon ${ detailedView ? "active" : ""}`}
                      onClick={() => handleDetailedViewChange(true)}
                    />
                  </div>
                </div>
              </div>
              <hr />

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

                <div className="mb-3">
                  <label className="form-label">Side Notes Modal</label>
                  <select
                    className="form-select"
                    value={hideSortNotes.toString()}
                    onChange={handleHideSideNotes}
                  >
                    <option value="false">Show</option>
                    <option value="true">Hide</option>
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
                  target="_blank"
                  href="https://chromewebstore.google.com/detail/ifaljgdldeljhephnhgecbleejgffbap?utm_source=item-share-cb"
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

      <a className="agent-image" href="https://i-notes-extension.netlify.app/help_center">
        <img src= "../assets/agent.png" height="70rem" width="70rem"/>
        <div className="agent-text">
          Need Help?
          <br/>
          I am here to help you.
        </div>
      </a>
    </div>
  );
}

const container = document.getElementById("settings-target");
const root = createRoot(container);
root.render(<Settings />);
