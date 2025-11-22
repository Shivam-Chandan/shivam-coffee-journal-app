// --- 1. CONFIGURATION AND IMPORTS ---

// Load environment variables from .env file for local development.
// This must be called before accessing any process.env variables.
// Cloud Run securely ignores this file and provides variables directly.
require('dotenv').config(); 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Essential for connecting React (frontend) to Express (backend)

const app = express();

// 2. Retrieve the MongoDB URI from the environment variables (Cloud Run or .env)
const MONGO_URI = process.env.MONGO_URI;

// Cloud Run provides the PORT environment variable. We use 5000 as a local fallback.
const PORT = process.env.PORT || 5000; 


// --- 2. MIDDLEWARE ---
// Use CORS to allow cross-origin requests
app.use(cors());

// Use express.json() to parse incoming JSON request bodies
app.use(express.json());


// --- 3. DATABASE CONNECTION ---

/**
 * Attempts to establish a connection to MongoDB using Mongoose.
 */
const connectDB = async () => {
    if (!MONGO_URI) {
        console.error("FATAL ERROR: MONGO_URI is not defined. Please set it in your .env file or Cloud Run environment variables.");
        process.exit(1); // Exit process if the critical variable is missing
    }
    try {
        // Mongoose 6+ simplifies the connection call
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connection successful!");
    } catch (err) {
        console.error("MongoDB connection failed:", err.message);
        console.error("Ensure your MONGO_URI is correct and your Atlas IP access is configured.");
        process.exit(1); // Exit process on connection failure
    }
};

// --- 4. ROUTES ---

// Health check / Root route
app.get('/', (req, res) => {
    // Check Mongoose connection state (1 means connected, 0 is disconnected)
    const dbStatus = mongoose.connection.readyState === 1 ? 'Yes' : 'No';
    res.send({ 
        status: 'Coffee Journal API is running!', 
        database: `Connected: ${dbStatus}`,
        port: PORT
    });
});

// IMPORTANT: You will add your specific API routes here 
// Example: app.use('/api/journal', require('./routes/journalRoutes'));


// --- 5. SERVER STARTUP ---

// Start the Express server and initiate the database connection
app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}. Attempting database connection...`);
});
