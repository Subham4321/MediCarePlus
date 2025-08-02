const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Register (Doctor or Patient)
router.post('/register', (req, res) => {
  const { role, name, email, password, specialization } = req.body;

  if (!['doctor', 'patient'].includes(role)) {
    return res.status(400).json({ msg: 'Invalid role' });
  }

  const table = role === 'doctor' ? 'doctors' : 'patients';
  const extraField = role === 'doctor' ? ', specialization' : '';
  const extraValue = role === 'doctor' ? `, '${specialization}'` : '';

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ msg: 'Server error' });

    db.query(
      `INSERT INTO ${table} (name, email, password${extraField}) VALUES (?, ?, ?${extraValue})`,
      [name, email, hash],
      (err) => {
        if (err) return res.status(400).json({ msg: 'Email already exists or invalid data' });
        res.json({ msg: `${role} registered successfully` });
      }
    );
  });
});

// ✅ Login (Doctor or Patient)
router.post('/login', (req, res) => {
  const { role, email, password } = req.body;
  const table = role === 'doctor' ? 'doctors' : 'patients';

  db.query(`SELECT * FROM ${table} WHERE email = ?`, [email], (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ msg: 'Invalid email or password' });

    const user = results[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (!isMatch) return res.status(400).json({ msg: 'Invalid email or password' });

      const token = jwt.sign({ id: user.id, role }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ msg: 'Login successful', token });
    });
  });
});

module.exports = router;
