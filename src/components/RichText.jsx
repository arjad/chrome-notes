import React, { useState, useRef } from "react";
import { toast } from "react-toastify";

const RichText = ({ editorRef, handleFormat, toggleVoiceInput, isListening, onUrlToggle, isUrlLinked, isLoggedIn }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const [showBlockOverlay, setShowBlockOverlay] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const uploadUrl = `${process.env.S3_BUCKET_URL}/${fileName}`;

      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!res.ok) {
        throw new Error(`S3 Error: ${res.status} ${res.statusText}`);
      }

      // Set focus to the editor so insertImage puts it in the correct place
      if (editorRef.current) {
        editorRef.current.focus();
      }
      
      document.execCommand("insertImage", false, uploadUrl);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    } catch (err) {
      console.warn("S3 Upload Error, falling back to local Base64 embedding:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL("image/jpeg", 0.7);

          if (editorRef.current) editorRef.current.focus();
          document.execCommand("insertImage", false, resizedBase64);
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = null;
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        alert("Failed to read image file.");
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = null;
      };
      reader.readAsDataURL(file);
    }
  };

  const isDark = document.body.classList.contains("dark-mode");
  const overlayBg = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)';
  const dialogBg = isDark ? '#1e1e2e' : '#ffffff';
  const overlayTextColor = isDark ? 'white' : 'black';
  const overlayBorderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';

  return (
    <section className="border rich-text mb-2" style={{ position: 'relative' }}>
      {showBlockOverlay && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: overlayBg,
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(3px)',
          borderRadius: '4px'
        }}>
          <div style={{
            background: dialogBg,
            color: overlayTextColor,
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            border: `1px solid ${overlayBorderColor}`,
            textAlign: 'center',
            maxWidth: '85%',
            position: 'relative'
          }}>
            <i 
              className="fa-solid fa-xmark" 
              style={{ cursor: 'pointer', position: 'absolute', top: '12px', right: '12px', color: overlayTextColor, fontSize: '16px' }} 
              onClick={() => {
                setShowBlockOverlay(false);
                chrome.storage.local.set({ loginBlockDismissedAt: Date.now() });
              }}
            ></i>
            <span style={{ fontSize: '14px', color: overlayTextColor, lineHeight: '1.4' }}>
              <strong>Login Required</strong><br/>
              Login to make sure that notes are kept safe.
            </span>
            <button 
              onClick={() => {
                chrome.tabs.create({ url: chrome.runtime.getURL('settings.html?tab=profile') });
              }}
              style={{
                background: '#684993',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                marginTop: '8px'
              }}
            >
              Login
            </button>
          </div>
        </div>
      )}
      {showLoginOverlay && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(2px)',
          borderRadius: '4px'
        }}>
          <div style={{
            background: '#1e1e2e',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(255,255,255,0.15)',
            textAlign: 'center',
            maxWidth: '85%'
          }}>
            <span style={{ fontSize: '14px', color: 'white', lineHeight: '1.4' }}>
              You need to <strong>log in</strong> to add images.
            </span>
            <button 
              onClick={() => {
                chrome.tabs.create({ url: chrome.runtime.getURL('settings.html?tab=profile') });
                setShowLoginOverlay(false);
              }}
              style={{
                background: '#684993',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                marginTop: '8px'
              }}
            >
              Go to Profile
            </button>
            <button
              onClick={() => setShowLoginOverlay(false)}
              style={{
                background: 'transparent',
                color: '#aaa',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <nav className="flex w-100 border-bottom" aria-label="Text formatting options">
        <button onClick={() => handleFormat("bold")} className="border-0 bg-transparent">
          <i className="fa-solid fa-bold"></i>
        </button>
        <button onClick={() => handleFormat("italic")} className="border-0 bg-transparent">
          <i className="fa-solid fa-italic"></i>
        </button>
        <button onClick={() => handleFormat("underline")} className="border-0 bg-transparent">
          <i className="fa-solid fa-underline"></i>
        </button>
        <button onClick={() => handleFormat("insertUnorderedList")} className="border-0 bg-transparent">
          <i className="fa-solid fa-list-ul"></i>
        </button>
        <button onClick={() => handleFormat("insertOrderedList")} className="border-0 bg-transparent">
          <i className="fa-solid fa-list-ol"></i>
        </button>
        <button onClick={() => handleFormat("code")} className="border-0 bg-transparent">
          <i className="fas fa-code"></i>
        </button>
        <button 
          onClick={() => {
            chrome.storage.local.get(["idToken"], (result) => {
              if (result.idToken) {
                fileInputRef.current && fileInputRef.current.click();
              } else {
                setShowLoginOverlay(true);
              }
            });
          }} 
          className="border-0 bg-transparent" 
          disabled={isUploading}
          title="Insert Image"
        >
          <i className={`fa-solid ${isUploading ? 'fa-spinner fa-spin' : 'fa-image'}`}></i>
        </button>
        <button
          onClick={() => onUrlToggle && onUrlToggle()}
          className={`border-0 ${!isUrlLinked ? 'bg-transparent' : ''}`}
          title="Link to Website URL"
          style={{
            color: isUrlLinked ? 'white' : 'inherit',
            backgroundColor: isUrlLinked ? '#684993' : 'transparent',
            borderRadius: '4px'
          }}
        >
          <i className="fa-solid fa-link"></i>
        </button>
        <div className="voice-wrapper float-end d-flex align-items-center gap-2">
          {isListening && (
            <img
              src="assets/record.gif"
              alt="Listening..."
              className="listening-img mr-2"
              style={{
                height: "25px"
              }}
            />
          )}
          <button
            onClick={toggleVoiceInput}
            className="border-0 bg-transparent"
          >
            <i
              className={`fa-solid ${isListening ? "fa-stop text-danger" : "fa-microphone"
                }`}
            ></i>
          </button>
        </div>
      </nav>
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        onChange={handleImageUpload} 
      />
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-label="Rich text editor"
        className="bg-transparent input-tag"
        id="note-input"
        placeholder="Enter your note here..."
        onFocus={(e) => {
          if (!isLoggedIn) {
            chrome.storage.local.get(["loginBlockDismissedAt"], (result) => {
              const now = Date.now();
              const oneDay = 24 * 60 * 60 * 1000;
              if (!result.loginBlockDismissedAt || (now - result.loginBlockDismissedAt > oneDay)) {
                e.target.blur();
                setShowBlockOverlay(true);
              }
            });
          }
        }}
        onKeyDown={(e) => {
          if (!isLoggedIn) {
            chrome.storage.local.get(["loginBlockDismissedAt"], (result) => {
              const now = Date.now();
              const oneDay = 24 * 60 * 60 * 1000;
              if (!result.loginBlockDismissedAt || (now - result.loginBlockDismissedAt > oneDay)) {
                e.preventDefault();
                setShowBlockOverlay(true);
              }
            });
          }
        }}
      ></div>
    </section>
  );
};

export default RichText;
