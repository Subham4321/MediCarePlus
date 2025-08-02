import express from "express";
import mysql from "mysql2";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Setup paths for static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(bodyParser.json());

// ✅ MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Error:", err);
    process.exit(1);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// ✅ Email Transporter for OTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Temporary in-memory store for OTPs
let otpStore = {};

//
// ------------------- PATIENT ROUTES -------------------
//

// Patient Sign Up
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.json({ success: false, error: "All fields required" });

  db.query("SELECT * FROM patients WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: "DB error" });
    if (results.length > 0)
      return res.json({ success: false, error: "Email already exists" });

    db.query(
      "INSERT INTO patients (name, email, password) VALUES (?, ?, ?)",
      [name, email, password],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, error: "DB error" });
        res.json({ success: true });
      }
    );
  });
});

// Patient Login → Send OTP
app.post("/send-otp", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM patients WHERE email=? AND password=?",
    [email, password],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: "DB error" });
      if (results.length === 0)
        return res.json({ success: false, error: "Invalid credentials" });

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      otpStore[email] = otp;

      // Send email
      transporter.sendMail(
        {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "MediCare+ OTP Verification",
          text: `Your OTP is: ${otp}`,
        },
        (mailErr) => {
          if (mailErr) {
            console.error(mailErr);
            return res.json({ success: false, error: "Failed to send OTP" });
          }
          res.json({ success: true });
        }
      );
    }
  );
});

// Patient Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (otpStore[email] && otpStore[email] == otp) {
    delete otpStore[email];
    res.json({ success: true });
  } else {
    res.json({ success: false, error: "Invalid OTP" });
  }
});

//
// ------------------- DOCTOR ROUTES -------------------
//

// Doctor Sign Up
app.post("/doctor/signup", (req, res) => {
  const { name, specialization, email, password } = req.body;
  if (!name || !specialization || !email || !password)
    return res.json({ success: false, error: "All fields required" });

  db.query("SELECT * FROM doctors WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: "DB error" });
    if (results.length > 0)
      return res.json({ success: false, error: "Email already exists" });

    db.query(
      "INSERT INTO doctors (name, specialization, email, password) VALUES (?, ?, ?, ?)",
      [name, specialization, email, password],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, error: "DB error" });
        res.json({ success: true });
      }
    );
  });
});

// Doctor Login → Send OTP
app.post("/doctor/send-otp", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM doctors WHERE email=? AND password=?",
    [email, password],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, error: "DB error" });
      if (results.length === 0)
        return res.json({ success: false, error: "Invalid credentials" });

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000);
      otpStore[email] = otp;

      // Send email
      transporter.sendMail(
        {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "MediCare+ Doctor OTP",
          text: `Your OTP is: ${otp}`,
        },
        (mailErr) => {
          if (mailErr) {
            console.error(mailErr);
            return res.json({ success: false, error: "Failed to send OTP" });
          }
          res.json({ success: true });
        }
      );
    }
  );
});

//
// ------------------- DOCTOR DASHBOARD -------------------
//

// Get all appointments
app.get("/doctor/appointments", (req, res) => {
  db.query(
    `SELECT a.id, p.name AS patient_name, a.appointment_time, a.status
     FROM appointments a
     JOIN patients p ON a.patient_id = p.id
     ORDER BY a.appointment_time ASC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(results);
    }
  );
});

// Update appointment status
app.put("/doctor/update-appointment/:id", (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;

  db.query(
    "UPDATE appointments SET status=? WHERE id=?",
    [status, appointmentId],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ success: true });
    }
  );
});

//
// ------------------- DEFAULT ROUTE -------------------
//

// Serve Patient Login as Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "patient-login.html"));
});

//
// ------------------- START SERVER -------------------
//
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
