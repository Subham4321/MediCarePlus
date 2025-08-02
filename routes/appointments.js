const express = require('express');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ✅ Book Appointment (Patient Only)
router.post('/book', auth, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ msg: 'Access denied' });

  const { doctor_id, appointment_date } = req.body;
  if (!doctor_id || !appointment_date) {
    return res.status(400).json({ msg: 'Doctor ID and appointment date required' });
  }

  db.query(
    `INSERT INTO appointments (doctor_id, patient_id, appointment_date) VALUES (?, ?, ?)`,
    [doctor_id, req.user.id, appointment_date],
    (err, result) => {
      if (err) return res.status(500).json({ msg: 'Database error', err });
      res.json({ msg: 'Appointment booked successfully', appointmentId: result.insertId });
    }
  );
});

// ✅ Get Appointments (Role-Based)
router.get('/my', auth, (req, res) => {
  let query = '';
  let value = req.user.id;

  if (req.user.role === 'patient') {
    query = `SELECT a.*, d.name AS doctor_name, d.specialization 
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
             WHERE a.patient_id = ?`;
  } else if (req.user.role === 'doctor') {
    query = `SELECT a.*, p.name AS patient_name 
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             WHERE a.doctor_id = ?`;
  } else {
    return res.status(403).json({ msg: 'Access denied' });
  }

  db.query(query, [value], (err, results) => {
    if (err) return res.status(500).json({ msg: 'Database error', err });
    res.json(results);
  });
});

// ✅ Cancel Appointment
router.put('/cancel/:id', auth, (req, res) => {
  const appointmentId = req.params.id;

  db.query(`SELECT * FROM appointments WHERE id = ?`, [appointmentId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ msg: 'Appointment not found' });

    const appointment = results[0];

    // Only the patient or doctor involved can cancel
    if (req.user.role === 'patient' && appointment.patient_id !== req.user.id)
      return res.status(403).json({ msg: 'Access denied' });

    if (req.user.role === 'doctor' && appointment.doctor_id !== req.user.id)
      return res.status(403).json({ msg: 'Access denied' });

    db.query(`UPDATE appointments SET status = 'cancelled' WHERE id = ?`, [appointmentId], (err) => {
      if (err) return res.status(500).json({ msg: 'Database error', err });
      res.json({ msg: 'Appointment cancelled successfully' });
    });
  });
});

// ✅ Reschedule Appointment (Patient Only)
router.put('/reschedule/:id', auth, (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).json({ msg: 'Access denied' });

  const appointmentId = req.params.id;
  const { new_date } = req.body;
  if (!new_date) return res.status(400).json({ msg: 'New appointment date required' });

  db.query(`SELECT * FROM appointments WHERE id = ?`, [appointmentId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ msg: 'Appointment not found' });

    const appointment = results[0];
    if (appointment.patient_id !== req.user.id) return res.status(403).json({ msg: 'Access denied' });

    db.query(`UPDATE appointments SET appointment_date = ? WHERE id = ?`, [new_date, appointmentId], (err) => {
      if (err) return res.status(500).json({ msg: 'Database error', err });
      res.json({ msg: 'Appointment rescheduled successfully' });
    });
  });
});

module.exports = router;
