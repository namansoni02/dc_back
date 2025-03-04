const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true, // Ensure that email is unique
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isDoctor: {
    type: Boolean,
    default: false,
  },
  notification: {
    type: Array,
    default: [],
  },
  seennotification: {
    type: Array,
    default: [],
  },
  qrCode: {
    type: String, // Store the QR code as a string (Base64-encoded image or a URL)
    default: "",
  },
  rollNumber: {
    type: String,
    required: [true, "Roll number is required"],
    unique: true, // Ensure that roll number is unique
  },
  medicalHistory: {
    type: [String],
    default: [],
  },
});

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
