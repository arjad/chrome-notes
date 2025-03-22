import React from "react";

const RichText = ({ editorRef, handleFormat }) => {
  return (
    <section className="border mb-2">
      <nav className="flex w-100 border-bottom" aria-label="Text formatting options">
        <button onClick={() => handleFormat("bold")} className="border">
          <i className="fa-solid fa-bold"></i>
        </button>
        <button onClick={() => handleFormat("italic")} className="border">
          <i className="fa-solid fa-italic"></i>
        </button>
        <button onClick={() => handleFormat("underline")} className="border">
          <i className="fa-solid fa-underline"></i>
        </button>
        <button onClick={() => handleFormat("insertUnorderedList")} className="border">
          <i className="fa-solid fa-list-ul"></i>
        </button>
        <button onClick={() => handleFormat("insertOrderedList")} className="border">
          <i className="fa-solid fa-list-ol"></i>
        </button>
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
