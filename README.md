# Library Management System Database Schema
This document provides an overview of the database schema for a library management system. The system is designed to manage books, members, staff, transactions, and deleted records efficiently.

## Tables Overview

### 1. **Books Table**

```sql
CREATE TABLE books ( 
    id INT AUTO_INCREMENT PRIMARY KEY, 
    title VARCHAR(255) NOT NULL, 
    author VARCHAR(255) NOT NULL, 
    genre VARCHAR(100), 
    description TEXT, 
    published_year YEAR, 
    copies_available INT DEFAULT 0, 
    publisher VARCHAR(255), 
    image LONGBLOB 
); 
```

### 2. **Staff table**
```sql
CREATE TABLE staff ( 
    id VARCHAR(20) NOT NULL PRIMARY KEY, 
    fname VARCHAR(50) NOT NULL, 
    lname VARCHAR(50) NOT NULL, 
    role VARCHAR(50) NOT NULL, 
    email VARCHAR(100) NOT NULL UNIQUE, 
    password VARCHAR(255) NOT NULL, 
    contact_info TEXT, 
    profile_picture LONGBLOB 
); 
```

### 3. **Members table**
```sql
CREATE TABLE members ( 
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    street VARCHAR(255) NOT NULL, 
    city VARCHAR(255) NOT NULL, 
    postalCode VARCHAR(20) NOT NULL, 
    fname VARCHAR(50) NOT NULL, 
    lname VARCHAR(50) NOT NULL, 
    phone VARCHAR(15) NOT NULL, 
    email VARCHAR(100) NOT NULL UNIQUE, 
    membership_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    password VARCHAR(255) NOT NULL, 
    profile_picture LONGBLOB 
); 
```
 
### 4. **Transactions table**

```sql
CREATE TABLE transactions ( 
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    member_id INT NOT NULL, 
    book_id INT NOT NULL, 
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP, 
    return_date DATETIME, 
    status ENUM('Borrowed', 'Returned') NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    FOREIGN KEY (member_id) REFERENCES Members(id), 
    FOREIGN KEY (book_id) REFERENCES Books(id) 
); 
```

### 5. **Deleted_record table: (Made to handle user and book deletion)**
```sql
CREATE TABLE deleted_record ( 
  id INT AUTO_INCREMENT PRIMARY KEY, 
  member_id INT NOT NULL, 
  book_id INT NOT NULL, 
  borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP, 
  return_date DATETIME DEFAULT NULL, 
  status ENUM('Borrowed', 'Returned') NOT NULL, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
  max_borrow DATETIME DEFAULT NULL 
); 
```



### You need to create a base case for the staff table as the owner, in my case:
```sql
INSERT INTO staff (id, fname, lname, role, email, password, contact_info, profile_picture) 
VALUES ('OWN0001', 'Fname', 'lname', 'owner', 'yourEmail@gmail.com', '$2b$10$FnImwYOiYYwdBAtQ8iP6BOkAFgS7RCgG0oo5BtbIoCW0blxRE705C', '0512345678', NULL);
```


The password is (Test1) but hashed.




### Run the database using MySQL by opening the terminal, cd into backend, "npm install" to install dependencies, and "npm start"

### Open another terminal and without cd, "npm install" to install dependencies, and "npm start" to start the react app

### In the server.js you will see the MySQL configuration, change the info below as needed for you schema

```javascript
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "@DBPPass@",
  database: "library",
  connectionLimit: 10, // Adjust limit as needed
});
```
