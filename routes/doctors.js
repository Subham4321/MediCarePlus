const express = require('express');
const db = require('../config/db');

const router = express.Router();

//  Get All Doctors
router.get('/', (req, res) => {
  db.query('SELECT id, name, specialization FROM doctors', (err, results) => {
    if (err) return res.status(500).json({ msg: 'Database error', err });
    res.json(results);
  });
});

module.exports = router;
