const express = require("express");
const {
  loginController,
  registerController,
  authController,
  applyDoctorController,
  getAllNotificationController,
  deleteAllNotificationController,
  getAllDocotrsController,
  bookeAppointmnetController,
  bookingAvailabilityController,
  userAppointmentsController,
  getCurrentUserDataController,
} = require("../controllers/userCtrl");
const authMiddleware = require("../middlewares/authMiddlewares");

//router onject
const router = express.Router();
router.get("/user-medical-history/current", authMiddleware, async (req, res) => {
  try {
    console.log("Fetching medical history for user ID:", req.body.userId);

    // Ensure these are properly imported at the top of the file
    const MedicalRecord = require("../models/medicalRecordModel");
    const User = require("../models/userModels");

    const userId = req.body.userId;

    // Add more detailed logging
    console.log("Full request body:", req.body);
    console.log("Authentication:", req.headers.authorization);

    // Verify user exists
    const patient = await User.findById(userId);
    if (!patient) {
      console.error("Patient not found for ID:", userId);
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    // Fetch medical records with doctor details
    const records = await MedicalRecord.find({ patient: patient._id })
      .populate("doctor", "name") // Note: changed from doctorId to doctor
      .sort({ createdAt: -1 }) // Changed from date to createdAt
      .lean();

    console.log("Found records:", records.length);

    res.status(200).json({ 
      success: true, 
      data: records 
    });
  } catch (error) {
    console.error("Detailed error fetching medical records:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching medical records",
      errorDetails: error.message 
    });
  }
});
//routes
//LOGIN || POST
router.post("/login", loginController);

//REGISTER || POST
router.post("/register", registerController);

//Auth || POST
router.post("/getUserData", authMiddleware, authController);

//userdata || GEt
router.get("/getUserData", authMiddleware, getCurrentUserDataController);

//APply Doctor || POST
router.post("/apply-doctor", authMiddleware, applyDoctorController);

//Notifiaction  Doctor || POST
router.post(
  "/get-all-notification",
  authMiddleware,
  getAllNotificationController
);
//Notifiaction  Doctor || POST
router.post(
  "/delete-all-notification",
  authMiddleware,
  deleteAllNotificationController
);

//GET ALL DOC
router.get("/getAllDoctors", authMiddleware, getAllDocotrsController);

//BOOK APPOINTMENT
router.post("/book-appointment", authMiddleware, bookeAppointmnetController);

//Booking Avliability
router.post(
  "/booking-availbility",
  authMiddleware,
  bookingAvailabilityController
);


const MedicalRecord = require("../models/medicalRecordModel");

// Get user's medical history
router.get(
  "/user-medical-history/:userId",
  authMiddleware,
  async (req, res) => {
    try {
      const doctor = req.body.userId;
      const userId = req.params.userId;

      // Check if user exists
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).send({
          success: false,
          message: "User not found",
        });
      }

      // Fetch medical records
      const medicalHistory = await MedicalRecord.find({ userId })
        .sort({ date: -1 })
        .populate("doctorId", "name email");

      return res.status(200).send({
        success: true,
        message: "User medical history fetched successfully",
        data: {
          user,
          medicalHistory,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Error fetching medical history",
        error,
      });
    }
  }
);

// Create prescription
router.post(
  "/create-prescription",
  authMiddleware,
  async (req, res) => {
    try {
      const doctorId = req.body.userId;
      const { userId, diagnosis, medications, advice, followUpDate } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send({
          success: false,
          message: "User not found",
        });
      }

      // Create new medical record with prescription
      const newRecord = new MedicalRecord({
        userId,
        doctorId,
        date: new Date(),
        diagnosis,
        medications,
        advice,
        followUpDate,
      });

      await newRecord.save();

      return res.status(201).send({
        success: true,
        message: "Prescription created successfully",
        data: newRecord,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Error creating prescription",
        error,
      });
    }
  }
);

router.get(
  "/get-medical-history",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.body.userId;
      
      // Fetch medical records
      const medicalHistory = await MedicalRecord.find({ userId })
        .sort({ date: -1 })
        .populate("doctorId", "name email");

      return res.status(200).send({
        success: true,
        message: "Medical history fetched successfully",
        data: medicalHistory,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        success: false,
        message: "Error fetching medical history",
        error,
      });
    }
  }
);

module.exports = router;
