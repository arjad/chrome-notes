import React from "react";
import Contributors from "../../components/Contributors.jsx";

const About = () => {
  return (
    <div className="card">
      <div className="card-body text-center">
        <img
          src="../assets/note.png"
          width="48"
          height="48"
          alt="i Notes Logo"
          className="mb-3"
        />
        <h5>About i Notes</h5>
        <p className="text-muted">
          A simple and efficient Chrome extension that lets you manage
          notes effortlessly.
        </p>
      </div>

      <Contributors/>
    </div>
  );
};

export default About;
