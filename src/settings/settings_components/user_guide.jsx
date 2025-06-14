import React from "react";

const UserGuide = () => {
  return (
    <div className="card p-4 space-y-10">
      <p>
        ✨ Welcome to <strong>I Notes</strong> <br/>
        Your new note-taking sidekick! 📝 Whether you're jotting down genius ideas 💡, making to-do lists ✅, or just writing random thoughts 🤪, I Notes makes it quick, easy, and even a little fun.  
        This guide will walk you through the magic 🪄 of creating, editing ✍️, deleting 🗑️, switching themes 🎨, and resizing the popup 📏 – all without breaking a sweat. Let's get started! 🚀
      </p>

      <section class="about">
        <div class="container">
          <div class="row mt-5">
            <div class="col-lg-6 col-12">
              <img src="../assets/user_guide1.png" class="user_guide-image" alt=""/>
            </div>

            <div class="col-lg-6 col-12 mt-5 mt-lg-0">
              <div class="about-thumb">
                <h6>Create Note</h6>
                <p> Simply type note and click "Save Note" to create a new note. It will be saved into your browser storage.</p>
              </div>
            </div>
          </div>

          <div class="row mt-5">
            <div class="col-lg-6 col-12 mt-5 mt-lg-0">
              <div class="about-thumb">
                <h6>Update Saved Note</h6>
                <p> Simply click on edit (pencil) icon, update the text in text box and click "Save Note" to update this note.</p>
              </div>
            </div>

            <div class="col-lg-6 col-12">
              <img src="../assets/user_guide2.png" class="user_guide-image" alt=""/>
            </div>
          </div>

          <div class="row mt-5">
            <div class="col-lg-6 col-12">
              <img src="../assets/user_guide3.png" class="user_guide-image" alt=""/>
            </div>
            <div class="col-lg-6 col-12 mt-5 mt-lg-0">
              <div class="about-thumb">
                <h6>Other Functions</h6>
                <p> You can copy the notes text to clip board using one click. You can also delete the note using one click. It will delete the note temporarily and you can again retrieve it from settings/Notes details tab. You can also pin the note using one click.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserGuide;
