const mysql = require('mysql2');

// ✅ Debug to check if .env variables are loading
console.log("DEBUG ENV:");
console.log("DB_USER:", process.env.DB_USER || "(empty)");
console.log("DB_PASS:", process.env.DB_PASS === "" ? "(empty)" : process.env.DB_PASS);
console.log("DB_NAME:", process.env.DB_NAME || "(empty)");

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'medical_appointment'
});

// ✅ Connect to MySQL
db.connect(err => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
    return;
  }
  console.log("✅ MySQL Connected");
});

module.exports = db;
