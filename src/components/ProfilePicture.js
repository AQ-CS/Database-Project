// src/components/ProfilePicture.js
import React, { useState, useEffect } from "react";
import Default from "./default.png"; // Import the default image
import './ProfilePicture.css'; // Import the CSS file for styling

const ProfilePicture = ({ userId }) => {
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/getProfilePicture/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.image) {
          setImageData(data.image);
        }
      })
      .catch((error) => console.error("Error fetching profile picture:", error));
  }, [userId]);

  return (
    <div className="profile-picture">
      <img 
        src={imageData || Default} // Use fetched image or default image
        alt="Profile"
        className="profile-img" 
      />
    </div>
  );
};

export default ProfilePicture;
