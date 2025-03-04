const express = require("express");
const {
  doctorloginController,
  doctorregisterController,
  doctorauthController,
  getAllDoctorsController,
  updateProfileController,
  getDoctorByIdController,
  doctorAppointmentsController,
  updateStatusController,
} = require("../controllers/doctorCtrl.js");

const authMiddleware = require("../middlewares/authMiddlewares.js");
const router = express.Router();
const MedicalRecord = require("../models/medicalRecordModel.js");
const userModel = require("../models/userModels.js");
const doctorModel = require("../models/doctorModel.js");

// ✅ Fetch Medical History by Roll Number
router.get("/user-medical-history/:rollNumber", authMiddleware, async (req, res) => {
  try {
    const { rollNumber } = req.params;
    let patient = await userModel.findOne({ rollNumber }).lean(); // Faster query

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const records = await MedicalRecord.find({ patient: patient._id })
      .populate("doctor", "name")
      .lean();

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching medical records:", error);
    res.status(500).json({ success: false, message: "Error fetching medical records" });
  }
});

// ✅ Update or Create Medical History by Roll Number
router.put("/update-medical-history/:rollNumber", authMiddleware, async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const { diagnosis, symptoms, prescription, notes, followUpDate, attachments, doctorId, prescriptionImage } = req.body;

    console.log(`Updating medical history for Roll Number: ${rollNumber}`, req.body);

    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID is required" });
    }

    let patient = await userModel.findOne({ rollNumber });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const formattedSymptoms = Array.isArray(symptoms) ? symptoms : symptoms ? [symptoms] : [];

    let existingRecord = await MedicalRecord.findOne({ patient: patient._id }).sort({ createdAt: -1 });

    if (!existingRecord) {
      existingRecord = new MedicalRecord({
        patient: patient._id,
        doctor: doctor._id,
        diagnosis,
        symptoms: formattedSymptoms,
        prescription,
        notes,
        followUpDate,
        attachments,
        prescriptionImage, // ✅ Save prescription image if provided
      });
    } else {
      existingRecord.diagnosis = diagnosis;
      existingRecord.symptoms = formattedSymptoms;
      existingRecord.prescription = prescription;
      existingRecord.notes = notes;
      existingRecord.followUpDate = followUpDate;
      existingRecord.attachments = attachments;
      existingRecord.prescriptionImage = prescriptionImage; // ✅ Update prescription image
      existingRecord.doctor = doctor._id;
    }

    await existingRecord.save();

    res.status(200).json({ success: true, message: "Medical record updated successfully" });
  } catch (error) {
    console.error("Error saving medical record:", error);
    res.status(500).json({ success: false, message: "Error saving medical record" });
  }
});

// ✅ Create New Medical History Entry
router.post("/create-medical-history", authMiddleware, async (req, res) => {
  try {
    const { rollNumber, diagnosis, prescription, symptoms, notes, followUpDate, attachments, prescriptionImage } = req.body;
    const doctorId = req.body.userId;

    let patient = await userModel.findOne({ rollNumber });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const formattedSymptoms = Array.isArray(symptoms) ? symptoms : symptoms ? [symptoms] : [];

    const newRecord = new MedicalRecord({
      patient: patient._id,
      doctor: doctorId,
      diagnosis,
      symptoms: formattedSymptoms,
      prescription,
      notes,
      followUpDate,
      attachments,
      prescriptionImage, // ✅ Save prescription image if provided
    });

    await newRecord.save();

    res.status(201).json({ success: true, message: "Medical record created successfully", data: newRecord });
  } catch (error) {
    console.error("Error creating medical record:", error);
    res.status(500).json({ success: false, message: "Error creating medical record" });
  }
});

// ✅ Fetch Prescription Image by Roll Number
router.get("/prescription-image/:rollNumber", authMiddleware, async (req, res) => {
  try {
    const { rollNumber } = req.params;

    let patient = await userModel.findOne({ rollNumber });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const record = await MedicalRecord.findOne({ patient: patient._id }).sort({ createdAt: -1 }).lean();
    if (!record || !record.prescriptionImage) {
      return res.status(404).json({ success: false, message: "No prescription image found" });
    }

    res.status(200).json({ success: true, prescriptionImage: record.prescriptionImage });
  } catch (error) {
    console.error("Error fetching prescription image:", error);
    res.status(500).json({ success: false, message: "Error fetching prescription image" });
  }
});

// ✅ Doctor Authentication & Profile Routes
router.post("/login", doctorloginController);
router.post("/doctorregister", doctorregisterController);
router.get("/auth", authMiddleware, doctorauthController);
router.get("/getDoctors", authMiddleware, getAllDoctorsController);
router.post("/updateProfile", authMiddleware, updateProfileController);
router.post("/getDoctorById", authMiddleware, getDoctorByIdController);

// ✅ Doctor Appointments & Status Updates
router.get("/doctor-appointments", authMiddleware, doctorAppointmentsController);
router.post("/update-status", authMiddleware, updateStatusController);

// ✅ Fetch All Appointments of a Doctor
router.get("/appointments/:doctorId", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const appointments = await doctorAppointmentsController(doctorId);
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ success: false, message: "Error fetching doctor appointments" });
  }
});



module.exports = router;
