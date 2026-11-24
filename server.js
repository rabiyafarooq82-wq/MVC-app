require('dotenv').config();
const express = require('express');
const app = express();

// Middleware to parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Thoda alag look dene ke liye add kiya

// Importing routes
const employeeRoutes = require('./routes/employeeRoutes');

// Mounting routes on /api
app.use('/api', employeeRoutes);

// Base health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: "Employee Management API is Live! 🏢" 
    });
});

// Server initialization
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`✅ Employee API server started on port ${PORT}`);
});