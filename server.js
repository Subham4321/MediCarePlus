import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------- MySQL Connection -----------------
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});
console.log("✅ MySQL Connected");

// ----------------- Email Setup -----------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ----------------- OTP Storage -----------------
const otpStorage = {};

// ----------------- Patient Login (Send OTP) -----------------
app.post("/send-otp", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.execute("SELECT * FROM patients WHERE email = ?", [email]);

  if (rows.length === 0) return res.status(400).json({ error: "Patient not found" });
  const patient = rows[0];

  const valid = await bcrypt.compare(password, patient.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStorage[email] = otp;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "MediCare+ OTP Login",
    text: `Your OTP is: ${otp}`,
  });

  res.json({ success: true, message: "OTP sent" });
});

// ----------------- Verify OTP -----------------
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (otpStorage[email] === otp) {
    delete otpStorage[email];
    return res.json({ success: true });
  }
  res.status(400).json({ error: "Invalid OTP" });
});

// ----------------- Book Appointment -----------------
app.post("/book-appointment", async (req, res) => {
  const { patientEmail, doctorId, date } = req.body;

  const [patients] = await db.execute("SELECT id FROM patients WHERE email = ?", [patientEmail]);
  if (patients.length === 0) return res.status(400).json({ error: "Patient not found" });

  const patientId = patients[0].id;

  await db.execute(
    "INSERT INTO appointments (patient_id, doctor_id, appointment_time) VALUES (?, ?, ?)",
    [patientId, doctorId, date]
  );

  res.json({ success: true, message: "Appointment booked" });
});

// ----------------- Load Patient Appointments -----------------
app.get("/appointments", async (req, res) => {
  const { email } = req.query;
  const [patients] = await db.execute("SELECT id FROM patients WHERE email = ?", [email]);
  if (patients.length === 0) return res.json([]);

  const patientId = patients[0].id;

  const [appointments] = await db.execute(
    `SELECT a.id, a.appointment_time, a.status, d.name AS doctor_name
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     WHERE a.patient_id = ?
     ORDER BY a.appointment_time ASC`,
    [patientId]
  );

  res.json(appointments);
});

// ----------------- Doctor Login -----------------
app.post("/doctor-login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.execute("SELECT * FROM doctors WHERE email = ?", [email]);

  if (rows.length === 0) return res.status(400).json({ error: "Doctor not found" });

  const doctor = rows[0];
  const valid = await bcrypt.compare(password, doctor.password);

  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  res.json({ success: true, doctorId: doctor.id });
});

// ----------------- Doctor Appointments -----------------
app.get("/doctor-appointments", async (req, res) => {
  const { email } = req.query;
  const [doc] = await db.execute("SELECT id FROM doctors WHERE email = ?", [email]);
  if (doc.length === 0) return res.json([]);

  const [appointments] = await db.execute(
    `SELECT a.id, a.appointment_time, a.status, p.name AS patient_name
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     WHERE a.doctor_id = ?
     ORDER BY a.appointment_time ASC`,
    [doc[0].id]
  );

  res.json(appointments);
});

// ----------------- Update Appointment -----------------
app.post("/update-appointment", async (req, res) => {
  const { id, status } = req.body;
  await db.execute("UPDATE appointments SET status = ? WHERE id = ?", [status, id]);
  res.json({ success: true });
});

// ----------------- Serve Frontend -----------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patient-login.html"));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
