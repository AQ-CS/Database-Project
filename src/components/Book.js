import React, { useState } from 'react';
import axios from 'axios'; // Import axios for API requests
import './Book.css';

const BookForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        genre: '',
        description: '',
        image: null,
        publishedYear: '',
        copiesAvailable: 0,
        publisher: '',
    });

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'file' ? files[0] : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('author', formData.author);
        formDataToSend.append('genre', formData.genre);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('image', formData.image); // Image file
        formDataToSend.append('published_year', formData.publishedYear); // Adjusted key
        formDataToSend.append('copies_available', formData.copiesAvailable); // Adjusted key
        formDataToSend.append('publisher', formData.publisher);

        // Send the form data to your API
        try {
            const response = await axios.post('http://localhost:5000/api/books', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });

            if (response.status === 201) {
                alert('Book added successfully!');
                // Reset the form state
                setFormData({
                    title: '',
                    author: '',
                    genre: '',
                    description: '',
                    image: null,
                    publishedYear: '',
                    copiesAvailable: 0,
                    publisher: '',
                });
            } else {
                alert('Failed to add the book.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while adding the book.');
        }
    };

    return (
        <div className="book-page">
            <h2 className="book-title">Add New Book</h2>
            <form className="book-form" onSubmit={handleSubmit}>
                <label>
                    Title: <span className="required">*</span>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                </label>
                <label>
                    Author:<span className="required">*</span>
                    <input type="text" name="author" value={formData.author} onChange={handleChange} required />
                </label>
                <label>
                    Genre:<span className="required">*</span>
                    <input type="text" name="genre" value={formData.genre} onChange={handleChange} required />
                </label>
                <label>
                    Description: <span className="required">*</span>
                    <textarea name="description" value={formData.description} onChange={handleChange} required></textarea>
                </label>
                <label className="book-image">
                    Image: <span className="required">*</span>
                    <input type="file" name="image" onChange={handleChange} accept="image/*" required />
                </label>
                <label>
                    Published Year: <span className="required">*</span>
                    <input type="number" name="publishedYear" value={formData.publishedYear} onChange={handleChange} min="1000" max={new Date().getFullYear()} required />
                </label>
                <label>
                    Copies Available: <span className="required">*</span>
                    <input type="number" name="copiesAvailable" value={formData.copiesAvailable} onChange={handleChange} required min="0" />
                </label>
                <label>
                    Publisher: <span className="required">*</span>
                    <input type="text" name="publisher" value={formData.publisher} onChange={handleChange} required />
                </label>
                <button type="submit" className="submit-button">Add Book</button>
            </form>
        </div>
    );
};

export default BookForm;
