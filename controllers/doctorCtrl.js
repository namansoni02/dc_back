const doctorModel = require("../models/doctorModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModels");
const appointmentModel = require("../models/appointmentModel");
const moment = require("moment");
const { registerController } = require("./userCtrl");

// Login controller
const doctorloginController = async (req, res) => {
  try {
    const user = await doctorModel.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "User not found", success: false });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Invalid Email or Password", success: false });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).send({
      message: "Login Success",
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        isDoctor: true, // ✅ Ensure this is included
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `Error in Login CTRL: ${error.message}` });
  }
};

// Doctor register
const doctorregisterController = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      website,
      address,
      specialization,
      experience,
      feesPerConsultation,
      timings,
    } = req.body;

    const exisitingDoctor = await doctorModel.findOne({
      email: req.body.email,
    });
    if (exisitingDoctor) {
      return res
        .status(200)
        .send({ message: "Doctor Already Exists", success: false });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newDoctor = new doctorModel({
      email,
      password: hashedPassword,
      name,
      phone,
      website,
      address,
      specialization,
      experience,
      feesPerConsultation,
      timings,
    });
    await newDoctor.save();
    res.status(201).send({ message: "Registered Successfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Error in Register Controller: ${error.message}`,
    });
  }
};

const doctorauthController = async (req, res) => {
  try {
    // Get the token from headers (Bearer <token>)
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).send({
        message: "Token is required",
        success: false,
      });
    }

    // Verify the token and decode the user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the doctor using the decoded user ID from the token
    const doctor = await doctorModel.findById(decoded.id).select("-password");

    if (!doctor) {
      return res.status(404).send({
        message: "Doctor not found",
        success: false,
      });
    }

    // Return the doctor's data (excluding password)
    res.status(200).send({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error in Doctor Authentication",
      success: false,
      error,
    });
  }
};

// Get all doctor info
const getAllDoctorsController = async (req, res) => {
  try {
    // Fetch all doctor records from the database
    const doctors = await doctorModel.find(); // This will fetch all doctors
    res.status(200).send({
      success: true,
      message: "Doctors data fetch success",
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Fetching Doctors Details",
    });
  }
};

// Update doctor profile
const updateProfileController = async (req, res) => {
  try {
    const doctor = await doctorModel.findOneAndUpdate(
      { userId: req.body.userId },
      req.body,
      { new: true }
    );
    res.status(201).send({
      success: true,
      message: "Doctor Profile Updated",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Doctor Profile Update issue",
      error,
    });
  }
};

// Get single doctor
const getDoctorByIdController = async (req, res) => {
  try {
    const doctor = await doctorModel.findOne({ _id: req.body.doctorId });
    res.status(200).send({
      success: true,
      message: "Single Doc Info Fetched",
      data: doctor,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Single doc info",
    });
  }
};

// Get doctor appointments
const doctorAppointmentsController = async (req, res) => {
  try {
    const doctor = await doctorModel.findOne({ userId: req.body.userId });
    const appointments = await appointmentModel.find({
      doctorId: doctor._id,
    });
    res.status(200).send({
      success: true,
      message: "Doctor Appointments fetch Successfully",
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Doc Appointments",
    });
  }
};

// Update appointment status
const updateStatusController = async (req, res) => {
  try {
    const { appointmentsId, status } = req.body;
    const appointments = await appointmentModel.findByIdAndUpdate(
      appointmentsId,
      { status }
    );
    const user = await userModel.findOne({ _id: appointments.userId });
    const notification = user.notification;
    notification.push({
      type: "status-updated",
      message: `Your appointment has been updated ${status}`,
      onClickPath: "/doctor-appointments",
    });
    await user.save();
    res.status(200).send({
      success: true,
      message: "Appointment Status Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error In Update Status",
    });
  }
};

module.exports = {
  doctorloginController,
  doctorregisterController,
  doctorauthController,
  getAllDoctorsController,
  updateProfileController,
  getDoctorByIdController,
  doctorAppointmentsController,
  updateStatusController,
};
