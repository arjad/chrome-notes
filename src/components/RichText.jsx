import React, { useState } from "react";

const RichText = ({ editorRef, handleFormat, toggleVoiceInput, isListening }) => {
  return (
    <section className="border rich-text mb-2">
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
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-label="Rich text editor"
        className="bg-transparent input-tag"
        id="note-input"
        placeholder="Enter your note here..."
      ></div>
    </section>
  );
};

export default RichText;
