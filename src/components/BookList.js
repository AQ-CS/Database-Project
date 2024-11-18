import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './BookList.css';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editQuantity, setEditQuantity] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Initialize the searchTerm state
  const [searchCategory, setSearchCategory] = useState("title"); // Initialize searchCategory if needed
  const user = JSON.parse(localStorage.getItem('user'));
  console.log('User:', user);
  const userType = user?.user_type;
  console.log('User Type:', userType);
  const memberId = user?.id;
  const navigate = useNavigate();
  const [borrowedBooks, setBorrowedBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/books');
        setBooks(response.data);
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    const fetchBorrowedBooks = async () => {
      if (user) {
        try {
          const response = await axios.get(`http://localhost:5000/api/borrowedBooks/${memberId}`);
          setBorrowedBooks(response.data);
        } catch (error) {
          console.error('Error fetching borrowed books:', error);
        }
      }
    };

    fetchBooks();
    fetchBorrowedBooks();
  }, [memberId]);

  // Local filtering based on searchTerm and searchCategory
  const filteredBooks = books.filter(book =>
    book[searchCategory].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (bookId, bookName) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the book "${bookName}"?`);
  
    if (isConfirmed) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/books/${bookId}`);
  
        if (response.data.status === "success") {
          alert(response.data.message); 
          setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId)); 
        } else if (response.data.status === "active_transaction") {
          alert("Cannot delete: " + response.data.message);  // Handle active transaction
        } else if (response.data.status === "not_found") {
          alert("Error: " + response.data.message);  // Book not found
        } else {
          alert("An unexpected error occurred. Please try again.");
        }

      } catch (error) {
        alert("Failed to delete the book. Please try again later.");
      }
    }
  };
  
  

  const handleBorrow = async (book) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/borrowBook', {
        memberId: memberId,
        bookId: book.id,
      });

      if (response.status === 200) {
        setBooks(prevBooks =>
          prevBooks.map(b =>
            b.id === book.id
              ? { ...b, copies_available: b.copies_available - 1 }
              : b
          )
        );
        alert('Book borrowed successfully!');
      }
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert(error.response?.data?.message || 'Failed to borrow book.');
    }
  };

  const handleReturn = async (book) => {
    try {
      const response = await axios.post('http://localhost:5000/api/returnBook', {
        memberId: memberId,
        bookId: book.id,
      });

      if (response.status === 200) {
        setBooks(prevBooks =>
          prevBooks.map(b =>
            b.id === book.id
              ? { ...b, copies_available: b.copies_available + 1 }
              : b
          )
        );
        setBorrowedBooks(prevBorrowedBooks =>
          prevBorrowedBooks.filter(b => b.id !== book.id)
        );
        alert('Book returned successfully!');
      }
    } catch (error) {
      console.error('Error returning book:', error);
      alert(error.response?.data?.message || 'Failed to return book.');
    }
  };

  // Editing functions
  const handleEditClick = (index, book) => {
    if (editIndex === index) {
      // If already in edit mode, save changes
      updateBookDetails(book.id);
    } else {
      // Enter edit mode
      setEditIndex(index);
      setEditDescription(book.description);
      setEditQuantity(book.copies_available);
    }
  };

  const handleDescriptionChange = (e) => {
    setEditDescription(e.target.value); // Ensure this properly updates the state
  };

  const handleQuantityChange = (e) => {
    setEditQuantity(e.target.value); // Ensure this properly updates the state
  };

  const updateBookDetails = async (bookId) => {
    const updatedCopiesAvailable = parseInt(editQuantity, 10); // Convert to number

    try {
      await axios.put(`http://localhost:5000/api/books/${bookId}`, {
        description: editDescription,
        copies_available: updatedCopiesAvailable,
      });
      setBooks(prevBooks =>
        prevBooks.map(book =>
          book.id === bookId
            ? { ...book, description: editDescription, copies_available: updatedCopiesAvailable }
            : book
        )
      );
      setEditIndex(null); // Exit edit mode after saving
    } catch (error) {
      console.error('Error updating book details:', error);
    }
  };

  return (
    <div className="book-list">
      <div className='search'>
        <p>Search Items: </p>
        <div className='search-bar'>
        <input
            type="text"
            placeholder="Search"
            value={searchTerm} // Bind to the searchTerm state
            onChange={(e) => setSearchTerm(e.target.value)} // Update the searchTerm state as user types
          />

          <select
            style={{ marginLeft: '10px' }}
            className="search-dropdown"
            value={searchCategory} // Bind to the new state
            onChange={(e) => setSearchCategory(e.target.value)} // Handle dropdown change
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="genre">Genre</option>
          </select>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <p className="no-books-found">No books found matching your search criteria.</p>
      ) : (
        filteredBooks.map((book, index) => (
          <div key={book.id} className="book-item">
            <img 
              src={book.image ? book.image : './default.png'} 
              alt={book.title} 
              className="book-image" 
            />
            <div className="book-info">
              <h3>{book.title}</h3>
              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>Genre:</strong> {book.genre}</p>
              <p>
                <strong>Description:</strong> 
                {editIndex === index ? (
                  <textarea
                    value={editDescription} // Bind to editDescription
                    onChange={handleDescriptionChange} // Ensure this is updating the state correctly
                    rows={4}
                    style={{ width: '100%', resize: 'none' }}
                  />
                ) : (
                  book.description
                )}
              </p>
              <div className="quantity-container">
                <p>
                  <strong>Quantity: </strong>
                  {editIndex === index ? (
                    <input
                      type="number"
                      value={editQuantity} // Bind to editQuantity
                      onChange={handleQuantityChange} // Ensure this is updating the state correctly
                      style={{ width: '50px' }}
                    />
                  ) : (
                    book.copies_available > 0 ? (
                      book.copies_available
                    ) : (
                      <span style={{ color: 'red' }}>Not Available Currently</span>
                    )
                  )}
                </p>
                
                <div>
                  {(userType === 'staff' || userType === 'admin' || userType === 'owner') && (
                    <button style={{backgroundColor: 'orange', color: 'black'}} onClick={() => handleEditClick(index, book)}>
                      {editIndex === index ? "Save" : "Modify"}
                    </button>
                  )}

                  {(userType === 'admin' || userType === 'owner') && (
                    <button style={{backgroundColor: 'red', color: 'white'}} className="delete-button" onClick={() => handleDelete(book.id, book.title)}>Delete</button>
                  )}
                </div>
                
                {userType === 'member' && (
                  borrowedBooks.some(b => b.id === book.id) ? (
                    <button
                      className="return-button"
                      onClick={() => handleReturn(book)}
                    >
                      Return
                    </button>
                  ) : (
                    <button
                      className="borrow-button"
                      onClick={() => handleBorrow(book)}
                      disabled={book.copies_available <= 0}
                    >
                      Borrow
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default BookList;
