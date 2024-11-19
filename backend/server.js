const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const compression = require("compression");
const { Parser } = require("json2csv");  // Import json2csv library to convert JSON to CSV
const app = express();

// Apply compression middleware for all responses
app.use(compression());

// Apply CORS middleware for cross-origin requests
app.use(cors());

// Increase the JSON request body size limit to 10MB (adjust as needed)
app.use(express.json({ limit: '10mb' }));  // Change '10mb' to a suitable limit for your use case

// Set up multer for file uploads (using memory storage to handle files in buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const PORT = 5000;
const HOST = '0.0.0.0';


// MySQL Database Connection
// Create a connection pool
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "@DBPPass@",
  database: "library",
  connectionLimit: 10, // Adjust limit as needed
});

// Log enqueued queries using the 'enqueue' event
db.on('enqueue', (sequence) => {
  console.log('Enqueued SQL:', sequence.sql);
});

// Root endpoint -> BookList.js
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

//Server for connection with database
app.listen(PORT, HOST, () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();

  // Get the local IP address of the server
  const localIp = Object.values(networkInterfaces)
    .flat()
    .find((iface) => iface.family === 'IPv4' && !iface.internal)?.address;

  console.log(`Server running on http://${localIp || 'localhost'}:${PORT}`);
});

// BOOKS API ===========================================================================================================

//Gets book cover 
app.get("/api/getBookCover/:bookId", (req, res) => {
  const bookId = req.params.bookId;

  const sqlQuery = "SELECT image FROM books WHERE id = ?";
  db.query(sqlQuery, [bookId], (err, results) => {
    if (err || results.length === 0) {
      console.error("Error fetching book cover image:", err);
      return res.status(500).json({ error: "Error fetching book cover image" });
    }

    const coverImage = results[0].image;
    if (coverImage) {
      const base64Image = coverImage.toString('base64');
      const imgSrc = `data:image/png;base64,${base64Image}`;
      res.json({ image: imgSrc }); // Send the Base64 string in JSON
    } else {
      res.status(404).json({ error: "No cover image found for this book" });
    }
  });
});

//For uploading books by staff -> adds to database
app.post('/api/books', upload.single('image'), (req, res) => {
  const { title, author, genre, description, published_year, copies_available, publisher } = req.body;
  const image = req.file ? req.file.buffer : null; // Get the image buffer

  // Check for required fields
  if (!title || !author || !genre || !description || !published_year || !copies_available || !publisher || !image) {
    console.log("Missing fields:", { title, author, genre, description, published_year, copies_available, publisher, image });
    return res.status(400).json({ error: "All fields are required, including the image." });
  }

  // SQL query to insert the book into the database
  const sqlQuery = `
    INSERT INTO books (title, author, genre, description, published_year, copies_available, publisher, image) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sqlQuery, [title, author, genre, description, published_year, copies_available, publisher, image], (err, result) => {
    if (err) {
      console.error("Database insertion error:", err);
      return res.status(500).json({ error: "Error adding the book" });
    }
    res.status(201).json({ message: 'Book added successfully', bookId: result.insertId });
  });
});

//Gets all the books from the database with all their fields
app.get('/api/books', async (req, res) => {
  try {
    const sqlQuery = 'SELECT id, title, author, genre, description, copies_available, image FROM books';
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ message: 'Error fetching books' });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({ message: 'No books found' });
      }

      // Map the results to include Base64 encoded images
      const booksWithImages = results.map(book => {
        let imgSrc = null;

        // Check if the image BLOB exists
        if (book.image) {
          // Convert the image Buffer to base64
          const base64Image = book.image.toString('base64');
          
          // Prefix with appropriate MIME type for images
          imgSrc = `data:image/jpeg;base64,${base64Image}`; // Assuming JPEG format

          // Use a default image if not valid
          if (base64Image.length < 100) {
            imgSrc = 'https://placecats.com/300/200'; // Use a default image if not valid
          }
        }

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          genre: book.genre,
          description: book.description,
          copies_available: book.copies_available,
          image: imgSrc // Include the Base64 image string
        };
      });

      res.json(booksWithImages); // Send the formatted response
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Error fetching books' });
  }
});

// For updating the book details (description and copies_available)
app.put('/api/books/:id', (req, res) => {
  const { id } = req.params; // Get the book ID from the URL
  const { description, copies_available } = req.body; // Get description and copies_available from request body

  // Check if description and copies_available are provided
  if (!description || copies_available === undefined) {
    return res.status(400).json({ error: "Description and copies_available are required." });
  }

  // SQL query to update both description and copies_available
  const sqlQuery = `
    UPDATE books
    SET description = ?, copies_available = ?
    WHERE id = ?
  `;

  db.query(sqlQuery, [description, copies_available, id], (err, result) => {
    if (err) {
      console.error("Database update error:", err);
      return res.status(500).json({ error: "Error updating the book details" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Book not found." });
    }

    res.status(200).json({ message: 'Book details updated successfully' });
  });
});

// DELETE /api/books/:id (Delete a book)
app.delete("/api/books/:id", (req, res) => {
  const bookId = req.params.id;
  console.log(`Received request to delete book with ID: ${bookId}`);

  // Step 1: Check if there are any active (unreturned) transactions for the book
  const checkTransactionQuery = `
    SELECT * FROM transactions 
    WHERE book_id = ? AND return_date IS NULL
  `;

  console.log(`Executing query to check active transactions: ${checkTransactionQuery}`);

  db.query(checkTransactionQuery, [bookId], (error, results) => {
    if (error) {
      console.error("Error checking transactions:", error);
      return res.status(500).json({ status: "error", message: "Internal server error" });
    }

    console.log(`Check transactions result:`, results);

    // If there are active transactions, prevent deletion and return a specific message
    if (results.length > 0) {
      console.log("Active transactions found, deletion not allowed.");
      return res.json({ status: "active_transaction", message: "Book has not been returned" });
    }

    // Step 2: Move transactions to deleted_record before deleting
    const moveToDeletedRecordQuery = `
      INSERT INTO deleted_record (id, member_id, book_id, borrow_date, return_date, status, created_at, updated_at, max_borrow)
      SELECT id, member_id, book_id, borrow_date, return_date, status, created_at, updated_at, max_borrow
      FROM transactions
      WHERE book_id = ?
    `;

    console.log(`Executing query to move transactions to deleted_record: ${moveToDeletedRecordQuery}`);
    
    db.query(moveToDeletedRecordQuery, [bookId], (error, results) => {
      if (error) {
        console.error("Error moving transactions to deleted_record:", error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
      }

      console.log(`Move transactions result:`, results);

      // Step 3: Delete all transactions associated with this book
      const deleteTransactionsQuery = "DELETE FROM transactions WHERE book_id = ?";
      console.log(`Executing query to delete transactions: ${deleteTransactionsQuery}`);
      
      db.query(deleteTransactionsQuery, [bookId], (error, results) => {
        if (error) {
          console.error("Error deleting transactions:", error);
          return res.status(500).json({ status: "error", message: "Internal server error" });
        }

        console.log(`Delete transactions result:`, results);

        // Step 4: Delete the book from the Books table
        const deleteBookQuery = "DELETE FROM Books WHERE id = ?";
        console.log(`Executing query to delete book: ${deleteBookQuery}`);
        
        db.query(deleteBookQuery, [bookId], (error, results) => {
          if (error) {
            console.error("Error deleting book:", error);
            return res.status(500).json({ status: "error", message: "Internal server error" });
          }

          // If the book is not found
          if (results.affectedRows === 0) {
            console.log("Book not found in the database.");
            return res.status(404).json({ status: "not_found", message: "Book not found" });
          }

          // Log successful book deletion
          console.log("Book and related transactions deleted successfully for book ID:", bookId);
          res.json({ status: "success", message: "Book and related transactions deleted successfully, and transactions moved to deleted_record" });
        });
      });
    });
  });
});

app.post("/api/borrowBook", (req, res) => {
  const { memberId, bookId } = req.body; // Ensure these keys match frontend keys

  const queryBook = "SELECT * FROM books WHERE id = ?";
  const queryMember = "SELECT * FROM members WHERE id = ?";
  
  db.query(queryBook, [bookId], (bookError, bookResults) => {
    if (bookError) {
      console.error("Book Query Error:", bookError);
      return res.status(500).json({ message: "Internal server error during book query." });
    }
    if (bookResults.length === 0) {
      return res.status(404).json({ message: "Book not found." });
    }

    const book = bookResults[0];
    if (book.copies_available <= 0) {
      return res.status(400).json({ message: "No copies available to borrow." });
    }

    db.query(queryMember, [memberId], (memberError, memberResults) => {
      if (memberError) {
        console.error("Member Query Error:", memberError);
        return res.status(500).json({ message: "Internal server error during member query." });
      }
      if (memberResults.length === 0) {
        return res.status(404).json({ message: "Member not found." });
      }

      const borrowDate = new Date();
      const queryTransaction = `
        INSERT INTO Transactions (member_id, book_id, borrow_date, status)
        VALUES (?, ?, ?, ?)
      `;
      
      db.query(queryTransaction, [memberId, bookId, borrowDate, "Borrowed"], (transactionError, transactionResults) => {
        if (transactionError) {
          console.error("Transaction Insertion Error:", transactionError);
          return res.status(500).json({ message: "Internal server error during transaction insertion." });
        }

        // Decrease available copies of the book
        const updateBookQuery = "UPDATE Books SET copies_available = ? WHERE id = ?";
        db.query(updateBookQuery, [book.copies_available - 1, bookId], (updateBookError) => {
          if (updateBookError) {
            console.error("Update Book Query Error:", updateBookError);
            return res.status(500).json({ message: "Internal server error during book update." });
          }
          res.json({ message: "Book borrowed successfully", transactionId: transactionResults.insertId });
        });
      });
    });
  });
});

// POST /api/returnBook (Return a book)
app.post("/api/returnBook", (req, res) => {
  const { memberId, bookId } = req.body;

  const queryTransaction = "SELECT * FROM Transactions WHERE member_id = ? AND book_id = ? AND status = 'Borrowed'";

  db.query(queryTransaction, [memberId, bookId], (transactionError, transactionResults) => {
    if (transactionError) {
      console.error("Transaction Query Error:", transactionError);
      return res.status(500).json({ message: "Internal server error" });
    }
    if (transactionResults.length === 0) {
      return res.status(404).json({ message: "No borrowed transaction found" });
    }

    const transaction = transactionResults[0];
    const returnDate = new Date();
    const updateTransactionQuery = "UPDATE Transactions SET return_date = ?, status = 'Returned' WHERE id = ?";

    db.query(updateTransactionQuery, [returnDate, transaction.id], (updateTransactionError) => {
      if (updateTransactionError) {
        console.error("Transaction Update Error:", updateTransactionError);
        return res.status(500).json({ message: "Internal server error during transaction update." });
      }

      // Increase available copies of the book
      const updateBookQuery = "UPDATE books SET copies_available = copies_available + 1 WHERE id = ?";
      db.query(updateBookQuery, [bookId], (updateBookError) => {
        if (updateBookError) {
          console.error("Update Book Query Error:", updateBookError);
          return res.status(500).json({ message: "Internal server error during book update." });
        }
        res.json({ message: "Book returned successfully" });
      });
    });
  });
});

// Get borrowed books for a specific member (books not yet returned)
app.get('/api/borrowedBooks/:memberId', (req, res) => {
  const { memberId } = req.params;

  // SQL query to get the book IDs that the member has borrowed but not yet returned
  const sqlQuery = `
    SELECT b.id, b.title, b.author, b.genre, b.description, b.published_year, b.copies_available, b.publisher, b.image
    FROM books b
    JOIN transactions t ON b.id = t.book_id
    WHERE t.member_id = ? AND t.return_date IS NULL AND t.status = 'Borrowed'
  `;

  db.query(sqlQuery, [memberId], (err, result) => {
    if (err) {
      console.error('Error fetching borrowed books:', err);
      return res.status(500).json({ error: 'Error fetching borrowed books' });
    }
    res.status(200).json(result); // Send the list of borrowed books to the client
  });
});




// USERS API ===========================================================================================================

//When user uploads PFP -> gets stored in database as LONGBLOB
app.post("/api/uploadProfilePicture/:userId", upload.single("profile_picture"), (req, res) => {
  const userId = req.params.userId;
  const profilePicture = req.file.buffer; // This is the binary data of the file

  const isAdminOrStaff = userId.startsWith('ADM') || userId.startsWith('STF') || userId.startsWith('OWN');
  const sqlQuery = isAdminOrStaff
    ? "UPDATE staff SET profile_picture = ? WHERE id = ?"
    : "UPDATE members SET profile_picture = ? WHERE id = ?";

  db.query(sqlQuery, [profilePicture, userId], (err) => {
    if (err) {
      console.error("Database update error:", err);
      return res.status(500).json({ error: "Error saving profile picture" });
    }
    res.json({ message: "Profile picture uploaded successfully" });
  });
});

//Signup -> registers user in database
app.post("/api/users", async (req, res) => {
  const { street, city, postalCode, fname, lname, email, password, phone } = req.body;

  // Check for required fields, including `phone`
  if (!street || !city || !postalCode || !fname || !lname || !email || !password || !phone) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  // Validate phone number format (basic example)
  const phoneRegex = /^[0-9]{7,15}$/; // Adjust as necessary
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: "Invalid phone number format" });
  }

  try {
    // Check if email already exists in either staff or members
    const checkEmailQuery = `SELECT email FROM staff WHERE email = ? UNION SELECT email FROM members WHERE email = ?`;
    db.query(checkEmailQuery, [email, email], async (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: "Email already exists in our records" });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      const sqlQuery = `
        INSERT INTO members (street, city, postalCode, fname, lname, email, password, phone, profile_picture) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(sqlQuery, [
        street,
        city,
        postalCode,
        fname,
        lname,
        email,
        hashedPassword,
        phone,
        null // Placeholder for profile_picture if no image provided
      ], (err, result) => {
        if (err) {
          console.error("Database insertion error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "User registered successfully" });
      });
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "Error processing registration" });
  }
});

//Gets user profile picture
app.get("/api/getProfilePicture/:userId", (req, res) => {
  const userId = req.params.userId;
  const isAdminOrStaff = userId.startsWith('ADM') || userId.startsWith('STF') || userId.startsWith('OWN');

  const sqlQuery = isAdminOrStaff
    ? "SELECT profile_picture FROM staff WHERE id = ?"
    : "SELECT profile_picture FROM members WHERE id = ?";

  db.query(sqlQuery, [userId], (err, results) => {
    if (err || results.length === 0) {
      console.error("Error fetching profile picture:", err);
      return res.status(500).json({ error: "Error fetching profile picture" });
    }

    const profilePicture = results[0].profile_picture;
    if (profilePicture) {
      // Convert the image buffer to a Base64 string
      const base64Image = profilePicture.toString('base64');
      const imgSrc = `data:image/png;base64,${base64Image}`;
      res.json({ image: imgSrc }); // Send the Base64 string in JSON
    } else {
      res.status(404).json({ error: "No profile picture found" });
    }
  });
});

//Get user details from database
app.get('/api/getUserDetails/:id', (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const sql = `SELECT id, fname, lname, email, street, city, postalCode, profile_picture, phone FROM members WHERE id = ?`;
  
  db.query(sql, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(results[0]);
  });
});

app.delete("/api/users/:id", (req, res) => {
  const userId = req.params.id;

  // Step 1: Check if the user has any active (unreturned) transactions
  const checkUserTransactionsQuery = `
    SELECT * FROM transactions 
    WHERE member_id = ? AND return_date IS NULL
  `;

  db.query(checkUserTransactionsQuery, [userId], (error, results) => {
    if (error) {
      console.error("Error checking user transactions:", error);
      return res.status(500).json({ status: "error", message: "Internal server error" });
    }

    // If there are active transactions, prevent deletion and return a specific message
    if (results.length > 0) {
      return res.json({ status: "active_transaction", message: "User has unreturned books" });
    }

    // Step 2: Move user's transactions to deleted_record before deleting
    const moveToDeletedRecordQuery = `
      INSERT INTO deleted_record (id, member_id, book_id, borrow_date, return_date, status, created_at, updated_at, max_borrow)
      SELECT id, member_id, book_id, borrow_date, return_date, status, created_at, updated_at, max_borrow
      FROM transactions
      WHERE member_id = ?
    `;
    
    db.query(moveToDeletedRecordQuery, [userId], (error, results) => {
      if (error) {
        console.error("Error moving transactions to deleted_record:", error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
      }

      // Step 3: Delete all transactions associated with this user
      const deleteUserTransactionsQuery = "DELETE FROM transactions WHERE member_id = ?";
      db.query(deleteUserTransactionsQuery, [userId], (error, results) => {
        if (error) {
          console.error("Error deleting user transactions:", error);
          return res.status(500).json({ status: "error", message: "Internal server error" });
        }

        // Step 4: Delete the user from the Members table
        const deleteUserQuery = "DELETE FROM Members WHERE id = ?";
        db.query(deleteUserQuery, [userId], (error, results) => {
          if (error) {
            console.error("Error deleting user:", error);
            return res.status(500).json({ status: "error", message: "Internal server error" });
          }

          // If the user is not found
          if (results.affectedRows === 0) {
            return res.status(404).json({ status: "not_found", message: "User not found" });
          }

          // Log successful user deletion
          console.log("User and related transactions deleted successfully for user ID:", userId);
          res.json({ status: "success", message: "User and related transactions deleted successfully, and transactions moved to deleted_record" });
        });
      });
    });
  });
});

// GET /api/members (Retrieve all members)
app.get("/api/members", (req, res) => {
  const query = `
    SELECT 
      id, fname, lname, phone, email, street, city, postalCode,
      DATE(membership_date) AS membership_date
    FROM members
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching members:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
    res.json(results);
  });
});



// STAFFS API ===========================================================================================================

//Registers staff to database -> accessible by admin, not staff
app.post('/api/staffUser', (req, res) => {
  const { fname, lname, role, email, password, contact_info } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Query to check if the email exists in members or staff
  const sql = `
    SELECT 1 FROM members WHERE email = ? 
    UNION 
    SELECT 1 FROM staff WHERE email = ? 
    LIMIT 1
  `;

  // Run the query to check for existing email
  db.query(sql, [email, email], (error, result) => {
    if (error) {
      console.error('Error checking email:', error);
      return res.status(500).json({ error: 'Server error' });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: 'Email already exists in either members or staff table' });
    }

    // Determine the role prefix (ADM or STF)
    const rolePrefix = role.toLowerCase() === 'admin' ? 'ADM' : 'STF';
    console.log('Role prefix:', rolePrefix);

    // Retrieve the highest ID with this role prefix
    const idQuery = 'SELECT id FROM staff WHERE id LIKE ? ORDER BY id DESC LIMIT 1';
    db.query(idQuery, [`${rolePrefix}%`], (error, rowsResult) => {
      if (error) {
        console.error('Error retrieving highest ID:', error);
        return res.status(500).json({ error: 'Server error' });
      }

      let newId;
      if (rowsResult.length > 0) {
        const lastId = rowsResult[0].id;
        const numericPart = parseInt(lastId.slice(rolePrefix.length)) + 1;
        newId = `${rolePrefix}${String(numericPart).padStart(5, '0')}`;
      } else {
        newId = `${rolePrefix}00001`; // Start from STF00001 or ADM00001
      }

      console.log('New ID generated:', newId);

      // Hash the password before inserting it
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        // Insert the new staff user into the database
        const insertSql = `
          INSERT INTO staff (id, fname, lname, role, email, password, contact_info) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(insertSql, [newId, fname, lname, role, email, hashedPassword, contact_info], (error) => {
          if (error) {
            console.error('Error inserting staff:', error);
            return res.status(500).json({ error: 'Server error' });
          }
          res.status(201).json({ message: 'Staff user created successfully', staffId: newId });
        });
      });
    });
  });
});

// GET /api/staff (Retrieve all staff members)
app.get("/api/staff", (req, res) => {
  const query = "SELECT id, role, fname, lname, email, contact_info FROM staff";

  db.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching staff members:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
    res.json(results);
  });
});

app.put("/api/users/:id", (req, res) => {
  const { role, fname, lname, email, contact_info } = req.body;
  const userId = req.params.id;
  console.log("Running: First Version (Callback-based)");
  // Retrieve the current role of the user
  db.query("SELECT role FROM staff WHERE id = ?", [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user role:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentRole = results[0].role;

    // If the role has changed, update the ID prefix
    if (currentRole !== role) {
      const rolePrefix = role.toLowerCase() === 'admin' ? 'ADM' : 'STF';

      // Retrieve the highest current ID with this prefix
      db.query(`SELECT id FROM staff WHERE id LIKE '${rolePrefix}%' ORDER BY id DESC LIMIT 1`, (err, rows) => {
        if (err) {
          console.error("Error retrieving highest ID:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        let newId;
        if (rows.length > 0) {
          // Extract the numeric part of the last ID and increment it
          const lastId = rows[0].id;
          const numericPart = parseInt(lastId.slice(rolePrefix.length)) + 1;
          newId = `${rolePrefix}${String(numericPart).padStart(5, '0')}`;
        } else {
          // Start numbering from 1 if no existing IDs with this prefix
          newId = `${rolePrefix}00001`;
        }

        // Update the user's info and role with the new ID
        const query = `UPDATE staff SET id = ?, role = ?, fname = ?, lname = ?, email = ?, contact_info = ? WHERE id = ?`;
        db.query(query, [newId, role, fname, lname, email, contact_info, userId], (error, updateResults) => {
          if (error) {
            console.error("Error updating user:", error);
            return res.status(500).json({ message: "Internal server error" });
          }

          res.json({ message: "User updated successfully", newId });
        });
      });
    } else {
      // If the role hasn't changed, just update the user information
      const query = `UPDATE staff SET fname = ?, lname = ?, email = ?, contact_info = ? WHERE id = ?`;
      db.query(query, [fname, lname, email, contact_info, userId], (error, updateResults) => {
        if (error) {
          console.error("Error updating user:", error);
          return res.status(500).json({ message: "Internal server error" });
        }

        res.json({ message: "User updated successfully" });
      });
    }
  });
});

// DELETE /api/users/:id (Delete a user)
app.delete("/api/deleteStaff/:id", (req, res) => {
  const userId = req.params.id;

  const query = "DELETE FROM staff WHERE id = ?";
  
  db.query(query, [userId], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.json({ message: "Staff deleted successfully" });
  });
});

//Get admin details from database if user is staff -> checked during profile open after login
app.get('/api/getAdminDetails/:id', (req, res) => {
  const id = req.params.id;

  // Execute the query
  db.query('SELECT * FROM staff WHERE id = ?', [id], (error, results) => {
    if (error) {
      console.error('Error fetching admin details for ID:', id, error);
      return res.status(500).json({ error: 'Server Error' });
    }

    // Check if results is an array and has elements
    if (!results || results.length === 0) {
      console.error('No admin found with ID:', id);
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(results[0]);
  });
});

//Checks if user is staff or a member
app.get('/api/getUserStatus/:id', (req, res)=>{
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const sql = `
    SELECT role FROM staff
    WHERE id = ?;
  `;
  
  db.query(sql, [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (results.length === 0) {
      return res.json({ role: "member" });
    }
    res.json(results[0]);
  });
});

app.put('/api/transactions/:id', (req, res) => {
  const userId = req.params.id;
  const allowedRoles = ['ADM', 'STF', 'OWN'];

  if (!allowedRoles.some(role => userId.startsWith(role))) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const query = `
    SELECT 
      * ,
      CASE
        WHEN max_borrow < CURRENT_TIMESTAMP AND return_date IS NULL THEN 'OVERDUE'
        WHEN return_date IS NOT NULL THEN 'COMPLETED'
        ELSE 'ACTIVE'
      END AS report_section
    FROM transactions
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching transactions:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Format dates
    const formattedTransactions = result.map(transaction => ({
      ...transaction,
      borrow_date: transaction.borrow_date ? transaction.borrow_date.toISOString().split('T')[0] : null,
      return_date: transaction.return_date ? transaction.return_date.toISOString().split('T')[0] : null,
      created_at: transaction.created_at ? transaction.created_at.toISOString().split('T')[0] : null,
      updated_at: transaction.updated_at ? transaction.updated_at.toISOString().split('T')[0] : null,
      max_borrow: transaction.max_borrow ? transaction.max_borrow.toISOString().split('T')[0] : null
    }));

    const activeTransactions = formattedTransactions.filter(t => t.report_section === 'ACTIVE');
    const overdueTransactions = formattedTransactions.filter(t => t.report_section === 'OVERDUE');
    const completedTransactions = formattedTransactions.filter(t => t.report_section === 'COMPLETED');

    const reportData = [
      ...activeTransactions,
      ...overdueTransactions,
      ...completedTransactions
    ];

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(reportData);

    res.header("Content-Type", "text/csv");
    res.attachment("transactions_report.csv");
    res.send(csv);
  });
});


// API FOR ALL USERS ===========================================================================================================
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // Query to find the user in both members and staff tables
  const sqlQuery = `
    SELECT id, email, password, fname, lname, 'member' AS user_type FROM members WHERE email = ?
    UNION 
    SELECT id, email, password, fname, lname, role AS user_type FROM staff WHERE email = ?
  `;

  db.query(sqlQuery, [email, email], async (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const user = results[0]; // Only one user should match per email due to unique constraints

    try {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        let loginMessage = ""
        if(user.user_type === 'staff'){
          loginMessage = "Logged in as staff!"
        } else if(user.user_type === 'admin'){
          loginMessage = "Logged in as admin!"
        } else if(user.user_type === 'owner'){
          loginMessage = "Logged in as owner!"
        }else{
          loginMessage = "Logged in as member!"
        }

        return res.json({
          message: loginMessage, // Add the login message
          user: {
            id: user.id,
            email: user.email,
            fname: user.fname,
            lname: user.lname,
            user_type: user.user_type // Identifies if they are a member or staff
          },
        });
      } else {
        return res.status(401).json({ error: "Incorrect email or password." });
      }
    } catch (error) {
      console.error("Error during password comparison:", error);
      return res.status(500).json({ error: "Error processing login." });
    }
  });
});

app.put('/api/updateUserDetails/:id', async (req, res) => {
  const { id } = req.params; // Get user ID from the URL parameter
  const userDetails = req.body; // Get the updated details from the request body

  let query;
  let values;

  try {
    // Check if the user ID contains 'ADM', 'STF', or 'OWN' for admin, staff, or owner roles
    if (id.includes('ADM') || id.includes('STF') || id.includes('OWN')) {

      // Direct update query for staff, admin, or owner
      query = `
        UPDATE staff 
        SET fname = ?, lname = ?, contact_info = ?
        WHERE id = ?
      `;
      values = [
        userDetails.fname, 
        userDetails.lname, 
        userDetails.contact_info,
        id
      ];
    } else {
      // Direct update query for members
      query = `
        UPDATE members 
        SET fname = ?, lname = ?, city = ?, street = ?, postalCode = ?, phone = ?
        WHERE id = ?
      `;
      values = [
        userDetails.fname, 
        userDetails.lname, 
        userDetails.city, 
        userDetails.street, 
        userDetails.postalCode, 
        userDetails.phone, 
        id
      ];
    }

    // Execute the update query using db.query with a promise
    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error executing update query:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err });
      }

      // Check if the update was successful
      if (result.affectedRows > 0) {
        return res.json({ success: true, message: 'User details updated successfully', updatedDetails: userDetails });
      } else {
        return res.status(400).json({ success: false, message: 'Failed to update user details' });
      }
    });

  } catch (error) {
    console.error('Error updating user details:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error });
  }
});
