import React, { useState, useEffect } from "react";
import UserPool from "./UserPool";
import {
  CognitoUserAttribute,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingSignIn, setLoadingSignIn] = useState(false);

  const [loading, setLoading] = useState(true); // NEW

  useEffect(() => {
    chrome.storage.local.get(["idToken", "accessToken", "notes"], (result) => {
      if (result.idToken && result.accessToken) {
        const user = UserPool.getCurrentUser();
        if (user) {
          user.getSession((err, session) => {
            if (!err && session.isValid()) {
              user.getUserAttributes((err, attrs) => {
                if (!err && attrs) {
                  const profile = {};
                  attrs.forEach((attr) => {
                    profile[attr.getName()] = attr.getValue();
                  });
                  profile.fullName = profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`;
                  profile.email = profile.email || session.getIdToken().payload.email;
                  profile.totalNotes = result.notes
  ? result.notes.filter((note) => !note.deleted).length
  : 0;


                  setProfileData(profile);
                  setIsLoggedIn(true);
                }
                setLoading(false);
              });
            } else {
              setLoading(false);
              setIsSigningIn(true);
            }
          });
        } else {
          setLoading(false);
          setIsSigningIn(true);
        }
      } else {
        setLoading(false);
        setIsSigningIn(true);
      }
    });
  }, []);


  // Sign Up handler
  function handleSignUp(e) {
    e.preventDefault();
    setLoadingSignIn(true);

    const attributeList = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name", Value: name }),
    ];

    UserPool.signUp(email, password, attributeList, null, (err, data) => {
      if (err) {
        alert(err.message || "Sign-up failed");
      } else {
        console.log("Sign-up successful:", data);
        setNeedsConfirmation(true);
      }
      setLoadingSignIn(false);
    });
  }

  // Confirm sign up handler
  function handleConfirm(e) {
    e.preventDefault();
    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    user.confirmRegistration(code, true, (err, result) => {
      if (err) {
        alert(err.message || "Confirmation failed");
      } else {
        console.log("Confirmation successful:", result);
        setNeedsConfirmation(false);
        setIsSigningIn(true);
      }
    });
  }

  async function fetchUserNotes(userId, idToken) {
    const res = await fetch(
      `${process.env.LAMBDA_URL}get_notes?userId=${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: idToken,
          "Content-Type": "application/json",
        },
      }
    );
  
    if (!res.ok) {
      throw new Error("Failed to fetch notes");
    }
    return await res.json();
  }

  function mergeNotes(localNotes = [], cloudNotes = []) {
    const map = new Map();
    cloudNotes.forEach(note => {
      if (note.id) map.set(note.id, note);
    });
    localNotes.forEach(note => {
      if (note.id) map.set(note.id, note);
    });
  
    return Array.from(map.values());
  }
  
  // Sign In handler
  function handleSignIn(e) {
    e.preventDefault();
    setLoadingSignIn(true);

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    user.authenticateUser(authDetails, {
      onSuccess: async (session) => {
        setLoadingSignIn(false);

        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        chrome.storage.local.set(
          { idToken, accessToken, refreshToken },
          () => console.log("Tokens stored in chrome.storage.local")
        );
        const userId = session.getIdToken().payload.sub;

        try {
          const cloudNotes = await fetchUserNotes(userId, idToken);
          chrome.storage.local.get(["notes"], (result) => {
            const localNotes = result.notes || [];
            const merged = mergeNotes(localNotes, cloudNotes);

            chrome.storage.local.set({ notes: merged }, () =>
              console.log("Notes merged successfully")
            );
          });
        } catch (err) {
          console.error(err);
        }

        user.getUserAttributes((err, attrs) => {
          if (!err && attrs) {
            const profile = {};
            attrs.forEach((attr) => {
              profile[attr.getName()] = attr.getValue();
            });
            setProfileData(profile);
            setIsLoggedIn(true);
          }
        });
      },
      onFailure: (err) => {
        setLoadingSignIn(false);
        alert(err.message || "Sign-in failed");
      },
    });
  }

  // Sign Out handler
  function handleSignOut() {
    const user = UserPool.getCurrentUser();
    if (user) {
      user.signOut();
    }
    chrome.storage.local.remove(["idToken", "accessToken", "refreshToken"], () => {
      console.log("Auth tokens cleared, notes preserved");
      setIsLoggedIn(false);
      setIsSigningIn(true);
    });
  }

  if (loading) {
    return (<div className="text-center my-5">
      <div className="spinner-border text-primary" role="status" />
      <div>Loading Profile...</div>
    </div>)
  }
  
  if (isLoggedIn && profileData) {
     return (
      <div className="container py-4">
        <div className="card shadow-sm p-4">
          <div className="row align-items-start">
            <div className="col-12 col-md-2 text-center">
              <i 
                className="fas fa-user-circle"
                style={{ fontSize: "150px", color: "#555" }}
              ></i>
            </div>     
  
            <div className="col-12 col-md-10">
              <p> Full Name: {profileData.fullName}</p>
              <p> Email: {profileData.email}</p>
            </div>
          </div>
          <br/>
          <hr/>
          <br/>
          <div>
            <h5 className="mb-3">Notes</h5>
            Total Notes: <strong>{profileData.totalNotes || 0}</strong>
          </div>
  
          <div className="mt-4 text-end">
            <button
              className="btn btn-sm btn-danger rounded-pill px-4"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (needsConfirmation) {
    return (
      <form onSubmit={handleConfirm}>
        <input
          type="text"
          className="bg-transparent border"
          placeholder="Confirmation code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <br/>
        <br/>
        <button type="submit" className="btn btn-primary btn-sm rounded-pill px-3 text-white">Confirm</button>
      </form>
    );
  }

  const goToSignUp = () => setIsSigningIn(false);
  const goToSignIn = () => setIsSigningIn(true);

  return (
    <div
      className={`container pt-5 ${!isSigningIn ? "right-panel-active" : ""}`}
      id="profile-container"
    >
      <div class="form-container sign-up-container">
        <form onSubmit={handleSignUp}>
          <h2>Create Account</h2>
          <br/>
          <input
            type="text"
            className="bg-transparent border"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            className="bg-transparent border"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="bg-transparent border"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br/>

          <button type="submit" disabled={loadingSignIn}>
            {loadingSignIn ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
      </div>

      <div class="form-container sign-in-container">
        <form onSubmit={handleSignIn}>
          <h2> Sign In </h2>
          <br/>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            className="bg-transparent border" 
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            className="bg-transparent border" 
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br/>
          <button type="submit" disabled={loadingSignIn}>
            {loadingSignIn ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      <div class="overlay-container">
        <div class="overlay">
          <div class="overlay-panel overlay-left">
            <h1>Welcome Back!</h1>
            <p>To keep connected with us please login with your personal info</p>
            <button className="ghost" id="signIn" onClick={goToSignIn}>Sign In</button>
            </div>
          <div class="overlay-panel overlay-right">
            <h1>Hello, Friend!</h1>
            <p>Enter your personal details and start journey with us</p>
            <button className="ghost" id="signUp" onClick={goToSignUp}>Sign Up</button>
            </div>
        </div>
      </div>
    </div>
  );
}
