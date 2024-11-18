import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Default from './default.png';
import './Profile.css';

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [role, setRole] = useState('');
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckedImage, setHasCheckedImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);  // New state for edit mode
  const [editedDetails, setEditedDetails] = useState({});
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')); // Assuming user is stored in local storage
  const memRole = user.user_type; // Assuming 'role' is a property of the user object
  console.log('User:', user);
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/getUserStatus/${user.id}`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        setRole(data.role || 'member'); // Default to 'member' if role does not exist
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        let response;
        if (user.id.startsWith('STF') || user.id.startsWith('ADM') || user.id.startsWith('OWN')) {
          response = await fetch(`http://localhost:5000/api/getAdminDetails/${user.id}`);
        } else {
          response = await fetch(`http://localhost:5000/api/getUserDetails/${user.id}`);
        }

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        setUserDetails(data);
        setEditedDetails(data);  // Initialize with current user details
      } catch (error) {
        console.error('Error fetching user details:', error);
        setUserDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/getProfilePicture/${user.id}`);
        if (!response.ok) throw new Error(`Error fetching profile picture: ${response.statusText}`);
        const data = await response.json();
        setImageData(data.image || null);
      } catch (error) {
        console.error(error.message);
      } finally {
        setHasCheckedImage(true);
      }
    };

    if (user && !hasCheckedImage && !['admin', 'staff', 'owner'].includes(role)) {
      fetchProfilePicture();
    }
  }, [user, hasCheckedImage, role]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profile_picture', file);

      fetch(`http://localhost:5000/api/uploadProfilePicture/${user.id}`, {
        method: 'POST',
        body: formData,
      })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            setHasCheckedImage(false); // Trigger a refetch of the image
          }
        });
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${user.id}`, {
        method: 'PUT',
      });
  
      // Check if the response is okay
      if (!response.ok) {
        const errorData = await response.json();
        alert('Error: ' + errorData.error);
        return;
      }
  
      // Convert the response to a blob for CSV download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions_report.csv'; // Filename for the report
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('An error occurred while downloading the report.');
    }
  };
  
  const handleInputChange = (e, field) => {
    setEditedDetails({
      ...editedDetails,
      [field]: e.target.value,
    });
  };

  const handleSaveChanges = async () => {
    // Prepare the details to be sent for update, excluding profile_picture
    const { profile_picture, ...detailsToUpdate } = { ...editedDetails };
  
    // Include first name and last name in the update
    detailsToUpdate.fname = editedDetails?.fname || userDetails?.fname;
    detailsToUpdate.lname = editedDetails?.lname || userDetails?.lname;
  
    // If the user is a member, include street, city, postalCode, and phone
    if (memRole === 'member') {
      detailsToUpdate.street = editedDetails?.street || userDetails?.street;
      detailsToUpdate.city = editedDetails?.city || userDetails?.city;
      detailsToUpdate.postalCode = editedDetails?.postalCode || userDetails?.postalCode;
      detailsToUpdate.phone = editedDetails?.phone || userDetails?.phone;
    }
  
    // If the user has a role of admin, staff, or owner, include contact_info
    if (['admin', 'staff', 'owner'].includes(userDetails?.role)) {
      detailsToUpdate.contact_info = editedDetails?.contact_info || userDetails?.contact_info;
    }
  
    console.log('Details to Update:', detailsToUpdate);
  
    try {
      // Send the update request to the server with the updated details, excluding profile_picture
      const response = await fetch(`http://localhost:5000/api/updateUserDetails/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailsToUpdate),
      });
  
      const data = await response.json();
  
      if (data.success) {
        // Update the userDetails and editedDetails with new data
        setUserDetails(detailsToUpdate); // Update the UI with new data
        setEditedDetails(detailsToUpdate); // Update edited details so the UI reflects changes
        setIsEditing(false); // Exit edit mode
        console.log('User details updated successfully');
      } else {
        console.error('Failed to update user details');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };
  
  if (loading) {
    return <div style={{ textAlign: 'center', color: 'white' }}>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-page">
      <h2 className="profile-title">
        {userDetails?.role === 'staff' && (
          <span className="badge"> Staff </span>
        )}
        {userDetails?.role === 'admin' && (
          <span className="badge"> Admin </span>
        )}
        {userDetails?.role === 'owner' && (
          <span className="badge"> Owner </span>
        )}
        Profile
      </h2>
      
      <div className="profile-content">
        <div className="profile-left">
          <img 
            src={imageData || Default} 
            alt="Profile"
            className="picture" 
          />
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            style={{ display: 'none' }} 
            id="file-input" 
          />
          <label htmlFor="file-input" className="change-pfp-btn">Change PFP</label>
        </div>
        
        <div className="profile-info">
          <div>
          <div>
            <p><strong>Email: </strong> {userDetails?.email}</p>
          </div>

          <p><strong>Name: </strong>
            {isEditing ? (
              <>
                <input 
                  type="text" 
                  value={editedDetails?.fname || ''}
                  onChange={(e) => handleInputChange(e, 'fname')}
                />
                <input 
                  type="text" 
                  value={editedDetails?.lname || ''}
                  onChange={(e) => handleInputChange(e, 'lname')}
                />
              </>
            ) : (
              `${userDetails?.fname} ${userDetails?.lname}`
            )}</p>
          </div>

          {memRole === 'member' && (
            <>
              <div>
              <p><strong>Street: </strong>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedDetails?.street || ''}
                    onChange={(e) => handleInputChange(e, 'street')}
                  />
                ) : (
                  userDetails?.street
                )}</p>
              </div>
              <div>
                <p><strong>City: </strong>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedDetails?.city || ''}
                    onChange={(e) => handleInputChange(e, 'city')}
                  />
                ) : (
                  userDetails?.city
                )}</p>
              </div>
              <div>
                <p><strong>Postal Code:</strong>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editedDetails?.postalCode || ''}
                    onChange={(e) => handleInputChange(e, 'postalCode')}
                  />
                ) : (
                  userDetails?.postalCode
                )}</p>
              </div>
              <div>
                <p><strong>Phone:</strong>
                {isEditing ? (
                  <input 
                    type="tel" 
                    value={editedDetails?.phone || ''}
                    onChange={(e) => handleInputChange(e, 'phone')}
                  />
                ) : (
                  userDetails?.phone
                )}</p>
              </div>
            </>
          )}

          {['admin', 'staff', 'owner'].includes(userDetails?.role) && (
            <p className='contact-info'>
              <strong>Contact Info: </strong>
              {isEditing ? (
                <input
                  type="text"
                  value={editedDetails?.contact_info || ''}
                  onChange={(e) => handleInputChange(e, 'contact_info')}
                />
              ) : (
                userDetails?.contact_info
              )}
            </p>
          )}

          {['admin', 'owner'].includes(userDetails?.role) && (
            <>
              <button 
                className='add-book-btn' 
                onClick={() => navigate('/book')}
              >
                Add Book
              </button>
              <button 
                className='add-staff-btn' 
                onClick={() => navigate('/regstaff')}
              >
                Add Staff
              </button>
            </>
          )}
          
          {userDetails?.role === 'owner' && (
              <button 
                  className='mod-staff-btn'   
                  onClick={() => navigate('/stafflist')}
                >
                  Staff List
                </button>
            )}
          
            {['admin', 'owner'].includes(userDetails?.role) && (
              <div className='button-container'>
                <button 
                    className='mod-user-btn' 
                    onClick={() => navigate('/memberslist')}
                  >
                    User List
                  </button>
                </div>
            )}

          {userDetails?.role === 'staff' && (
            <>
              <button 
                className='add-book-btn' 
                onClick={() => navigate('/book')}
              >
                Add Book
              </button>
            </>
          )}
          
          {isEditing ? (
            <button className="mod-info-btn" style={{backgroundColor: '#003f79'}} onClick={handleSaveChanges}>Save Changes</button>
          ) : (
            <button className="mod-info-btn" onClick={() => setIsEditing(true)}>Modify Info</button>
          )}

          {['admin', 'owner', 'staff'].includes(userDetails?.role) && (
            <button 
            style={{marginBottom: '20px'}}
              className='print-report-btn'
              onClick={handleDownloadReport}
            >
              Download Transactions Report
            </button>
          )}
                        
        </div>
      </div>
    </div>
  );
};

export default Profile;
