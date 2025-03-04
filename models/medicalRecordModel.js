const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    prescription: {
      type: String,
      default: "",
    },
    prescriptionImage: {
      type: String, // URL or Base64 encoded image data
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    followUpDate: {
      type: Date,
    },
    attachments: {
      type: [String], // URLs to files
      default: [],
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const MedicalRecord = mongoose.model("medicalrecords", medicalRecordSchema);
module.exports = MedicalRecord;