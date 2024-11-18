import React, { useEffect, useState } from 'react';
import axios from 'axios';  // Make sure to import axios
import "./MembersList.css";

const MembersList = () => {
  const [membersList, setMembersList] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("id"); // Default search filter to ID

  useEffect(() => {
    fetchMembers();
  }, []);

  // Fetch all members from backend
  const fetchMembers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/members");
      const data = await response.json();
      setMembersList(data);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  // Delete member from backend
  const handleDelete = async (userId, userName) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the user "${userName}"?`);
  
    if (isConfirmed) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/users/${userId}`);
  
        switch (response.data.status) {
          case "success":
            alert(response.data.message);
            setMembersList(prevMembers => prevMembers.filter(member => member.id !== userId)); // Update the state
            break;
          case "active_transaction":
            alert("Cannot delete: " + response.data.message);  // Handle active transaction
            break;
          case "not_found":
            alert("Error: " + response.data.message);  // User not found
            break;
          default:
            alert("An unexpected error occurred. Please try again.");
        }
  
      } catch (error) {
        alert("Failed to delete the user. Please try again later.");
      }
    }
  };

  // Filter members list based on search query and filter
    const filteredMembersList = membersList.filter((member) => {
        let valueToSearch = "";
        
        if (searchFilter === "name") {
        // Concatenate fname and lname for searching
        valueToSearch = `${member.fname} ${member.lname}`.toLowerCase();
        } else {
        // Otherwise, search on the selected field directly
        valueToSearch = (member[searchFilter]?.toString().toLowerCase() || "");
        }
        
        return valueToSearch.includes(searchQuery.toLowerCase());
    });
  

  return (
    <div className="members-list-container">
      <div className="header-container">
        <h2>Members List</h2>

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
            <option value="id">ID</option>
            <option value="name">Name</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </select>
        </div>
      </div>

      {statusMessage && <div className="status-message">{statusMessage}</div>}

      <table className="members-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Address</th>
            <th>Membership Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembersList.map((member) => (
            <tr key={member.id}>
              <td>{member.id}</td>
              <td>{`${member.fname} ${member.lname}`}</td>
              <td>{member.phone}</td>
              <td>{member.email}</td>
              <td>{`${member.street}, ${member.city}, ${member.postalCode}`}</td>
              <td>{new Date(member.membership_date).toLocaleDateString()}</td>
              <td>
                <button
                  style={{ backgroundColor: "red", color: "white" }}
                  onClick={() => handleDelete(member.id, `${member.fname} ${member.lname}`)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MembersList;
