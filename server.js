const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db.js');

//Add this with your other imports
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

// Create an Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // Log HTTP requests in development mode

// Routes
app.use('/api/v1/user', require('./routes/userRoutes.js')); // User routes
app.use('/api/v1/admin', require('./routes/adminRoutes.js')); // Admin routes
app.use('/api/v1/doctor', require('./routes/doctorRoutes.js')); // Doctor routes



// Add this with your other app.use statements
app.use("/api/v1/medical-records", medicalRecordRoutes);

// Start the server
const PORT = process.env.PORT || 8070;

app.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_MODE} mode on port ${PORT}`.bgCyan.black
  );
});