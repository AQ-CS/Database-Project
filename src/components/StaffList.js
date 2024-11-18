import React, { useEffect, useState } from 'react';
import "./StaffList.css";

const StaffList = () => {
  const [staffList, setStaffList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("fname"); // Default search filter
  const validRoles = ["admin", "staff"]; // Add all allowed roles here

  useEffect(() => {
    fetchStaff();
  }, []);

  // Fetch all staff from backend
  const fetchStaff = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/staff");
      const data = await response.json();
      setStaffList(data);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  // Handle input changes for editable fields
  const handleInputChange = (e, field, id) => {
    setEditData({
      ...editData,
      [id]: {
        ...editData[id],
        [field]: e.target.value,
      },
    });
  };

  // Toggle between viewing and editing mode
  const handleModifyClick = (index, staff) => {
    if (editIndex === index) {
      // If in edit mode, submit updated data
      updateStaff(staff.id);
    }
    setEditIndex(editIndex === index ? null : index);
    setEditData({ ...editData, [staff.id]: staff });
  };

  const updateStaff = async (id) => {
    const updatedStaff = editData[id];
    
    // Check if the role is valid
    if (updatedStaff.role && !validRoles.includes(updatedStaff.role.toLowerCase())) {
      setStatusMessage("Invalid role. Please enter a valid role (e.g., admin, manager, staff, intern).");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedStaff,
          role: updatedStaff.role.toLowerCase() // Ensure role is saved in lowercase
        }),
      });
      const result = await response.json();
      setStatusMessage(result.message);
      fetchStaff(); // Refresh the staff list after update
    } catch (error) {
      console.error("Error updating staff:", error);
      setStatusMessage("Failed to update staff. Please try again.");
    }
  };

  // Delete staff from backend
  const handleDelete = async (id) => {
    if (id.includes("OWN")) {
      setStatusMessage("You cannot delete this staff.");
      return; // Stop execution if the id contains "OWN"
    }
  
    if (!window.confirm("Are you sure you want to delete this staff?")) {
      return;
    }
  
    try {
      await fetch(`http://localhost:5000/api/deleteStaff/${id}`, { method: "DELETE" });
      setStatusMessage("Staff deleted successfully.");
      fetchStaff(); // Refresh the staff list after deletion
    } catch (error) {
      console.error("Error deleting staff:", error);
      setStatusMessage("Failed to delete staff. Please try again.");
    }
  };
  

  // Filter staff list based on search query and filter
  const filteredStaffList = staffList.filter((staff) => {
    const valueToSearch = staff[searchFilter]?.toString().toLowerCase() || "";
    return valueToSearch.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="staff-list-container">
      <div className='header-container'>
        <h2>Staff List   </h2>

        <div className="search-bar">
        <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />


          <select
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="search-dropdown"
          >
            <option value="fname">First Name</option>
            <option value="lname">Last Name</option>
            <option value="id">ID</option>
            <option value="role">Role</option>
          </select>
       
        </div>
      </div>
      
      {statusMessage && <div className="status-message">{statusMessage}</div>}

      <table className="staff-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Role</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Contact Info</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStaffList.map((staff, index) => (
            <tr key={staff.id}>
              <td>{staff.id}</td>
              <td>
                {editIndex === index ? (
                  <input
                    type="text"
                    value={editData[staff.id]?.role || staff.role}
                    onChange={(e) => handleInputChange(e, "role", staff.id)}
                  />
                ) : (
                  staff.role
                )}
              </td>
              <td>
                {editIndex === index ? (
                  <input
                    type="text"
                    value={editData[staff.id]?.fname || staff.fname}
                    onChange={(e) => handleInputChange(e, "fname", staff.id)}
                  />
                ) : (
                  staff.fname
                )}
              </td>
              <td>
                {editIndex === index ? (
                  <input
                    type="text"
                    value={editData[staff.id]?.lname || staff.lname}
                    onChange={(e) => handleInputChange(e, "lname", staff.id)}
                  />
                ) : (
                  staff.lname
                )}
              </td>
              <td>
                {editIndex === index ? (
                  <input
                    type="email"
                    value={editData[staff.id]?.email || staff.email}
                    onChange={(e) => handleInputChange(e, "email", staff.id)}
                  />
                ) : (
                  staff.email
                )}
              </td>
              <td>
                {editIndex === index ? (
                  <input
                    type="tel"
                    value={editData[staff.id]?.contact_info || staff.contact_info}
                    onChange={(e) => handleInputChange(e, "contact_info", staff.id)}
                  />
                ) : (
                  staff.contact_info
                )}
              </td>
              <td>
                <button style={{backgroundColor: "green", color: "white"}} onClick={() => handleModifyClick(index, staff)}>
                  {editIndex === index ? "Save" : "Modify"}
                </button>
                <button style={{backgroundColor: "red", color: "white"}} onClick={() => handleDelete(staff.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffList;
