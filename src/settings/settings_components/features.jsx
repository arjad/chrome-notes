import React, { useEffect, useState } from "react";

const FeaturesList = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(process.env.LAMBDA_URL)
      .then((res) => res.json())
      .then((json) => {
        setFeatures(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching from Lambda:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status" />
        <div>Loading features...</div>
      </div>
    );
  }

  return (
    <div className="row mt-3 justify-content-center">
      {features.map((f, idx) => (
        <div key={idx} className="border col-3 mx-2 mb-4 rounded p-2">
          {f.status === "released" && (
            <img className="float-end" height="50" src="../assets/released.png" alt="Released" />
          )}
          <div className="mt-3 flex-1">
            <h5 className="text-lg font-semibold">{f.name}</h5>
            <p className="text-sm text-gray-600">{f.description}</p>
            <div className="mt-2 flex justify-between">
              <span> 👍 {f.votes} votes</span>
              <span className="float-end"> 📅 {f.release_date}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturesList;
