// src/api.js
const BASE_URL = "http://localhost:5000/api";

export const fetchBooks = async () => {
  try {
    const response = await fetch(`${BASE_URL}/books`);

    // Check if the response is okay (status in the range 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching books:", error.message); // Log the error message
    // Optionally, you can return a default value or rethrow the error
    return []; // Return an empty array or null as a fallback
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error registering user:", error.message); // Log the error message
    // Optionally, you can return a default value or rethrow the error
    return null; // Return null as a fallback
  }
};
