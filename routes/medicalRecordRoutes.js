const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddlewares");
const MedicalRecord = require("../models/medicalRecordModel");
const User = require("../models/userModels");

// Get all medical records for a specific user
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if the requester is the user or a doctor
    const isAuthorized = 
      req.body.userId === userId || 
      (await User.findById(req.body.userId))?.isDoctor;
    
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to access these records" 
      });
    }

    const records = await MedicalRecord.find({ patient: userId })
      .populate("doctor", "name email")
      .sort({ visitDate: -1 });
    
    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching medical records",
      error: error.message,
    });
  }
});

// Create a new medical record (doctor only)
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const doctor = await User.findById(req.body.userId);
    
    if (!doctor.isDoctor) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create medical records",
      });
    }

    // Find patient by roll number or create new user entry
    let patient = await User.findOne({ rollNumber: req.body.rollNumber });
    if (!patient) {
      patient = new User({ rollNumber: req.body.rollNumber, isPatient: true });
      await patient.save();
    }

    const newRecord = new MedicalRecord({
      ...req.body,
      doctor: req.body.userId,
      patient: patient._id,
    });

    await newRecord.save();
    
    res.status(201).json({
      success: true,
      message: "Medical record created successfully",
      data: newRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating medical record",
      error: error.message,
    });
  }
});

// Get a specific medical record by ID
router.get("/:recordId", authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.params;
    const record = await MedicalRecord.findById(recordId)
      .populate("doctor", "name email")
      .populate("patient", "name email phone");
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    // Check if the requester is the patient, the doctor who created the record, or another doctor
    const isPatient = record.patient._id.toString() === req.body.userId;
    const isRecordDoctor = record.doctor._id.toString() === req.body.userId;
    const requestingUser = await User.findById(req.body.userId);
    const isDoctor = requestingUser?.isDoctor;

    if (!isPatient && !isRecordDoctor && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this record",
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching medical record",
      error: error.message,
    });
  }
});

// Update a medical record (doctor only)
router.put("/:recordId", authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.params;
    const record = await MedicalRecord.findById(recordId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    // Only the doctor who created the record can update it
    if (record.doctor.toString() !== req.body.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the doctor who created this record can update it",
      });
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      recordId,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Medical record updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating medical record",
      error: error.message,
    });
  }
});

module.exports = router;