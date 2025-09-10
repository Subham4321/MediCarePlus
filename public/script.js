// ------------------- Toast Notifications -------------------
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100); // slide in

  setTimeout(() => {
    toast.classList.remove("show"); // slide out
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// ------------------- Patient Signup -------------------
async function signup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const response = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json();
  if (data.success) {
    showToast("✅ Signup successful! OTP sent to your email.", "success");
    document.getElementById("signupOtpSection").classList.remove("hidden");
  } else {
    showToast(data.error || "❌ Signup failed", "error");
  }
}

async function verifySignupOTP() {
  const email = document.getElementById("signupEmail").value;
  const otp = document.getElementById("signupOtpInput").value;

  const response = await fetch("/verify-signup-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });

  const data = await response.json();
  if (data.success) {
    showToast("🎉 Account verified! You can now log in.", "success");
    setTimeout(() => (window.location.href = "index.html"), 2000);
  } else {
    showToast("❌ Invalid OTP", "error");
  }
}

// ------------------- Patient Login -------------------
async function sendOTP() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (data.success) {
    showToast("📧 OTP sent to your email", "success");
    document.getElementById("otpSection").classList.remove("hidden");
  } else {
    showToast(data.error || "❌ Login failed", "error");
  }
}

async function verifyOTP() {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otpInput").value;

  const response = await fetch("/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });

  const data = await response.json();
  if (data.success) {
    showToast("✅ Login successful!", "success");
    document.getElementById("loginCard").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    loadAppointments(email);
  } else {
    showToast("❌ Invalid OTP", "error");
  }
}

// ------------------- Book Appointment -------------------
async function bookAppointment() {
  const email = document.getElementById("email").value;
  const doctorId = document.getElementById("doctorId").value;
  const date = document.getElementById("appointmentDate").value;

  if (!date) {
    showToast("⚠️ Please select a date and time", "error");
    return;
  }

  const response = await fetch("/book-appointment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientEmail: email, doctorId, date })
  });

  const data = await response.json();
  if (data.success) {
    showToast("🎉 Appointment booked!", "success");
    loadAppointments(email);
  } else {
    showToast(data.error || "❌ Failed to book", "error");
  }
}

// ------------------- Load Patient Appointments -------------------
async function loadAppointments(email) {
  const response = await fetch(`/appointments?email=${encodeURIComponent(email)}`);
  const data = await response.json();

  const list = document.getElementById("appointmentsList");
  list.innerHTML = "";

  data.forEach(app => {
    const li = document.createElement("li");
    li.innerHTML = `
      <b>Doctor:</b> ${app.doctor_name} <br>
      <b>Time:</b> ${new Date(app.appointment_time).toLocaleString()} <br>
      <b>Status:</b> ${app.status}
    `;
    list.appendChild(li);
  });
}

// ------------------- Doctor Login -------------------
async function doctorLogin() {
  const email = document.getElementById("doctorEmail").value;
  const password = document.getElementById("doctorPassword").value;

  const response = await fetch("/doctor-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (data.success) {
    showToast("✅ Doctor Logged In", "success");
    document.getElementById("doctorLoginCard").classList.add("hidden");
    document.getElementById("doctorDashboard").classList.remove("hidden");
    loadDoctorAppointments(email);

    // Auto-refresh every 10 seconds
    setInterval(() => loadDoctorAppointments(email), 10000);
  } else {
    showToast(data.error || "❌ Login failed", "error");
  }
}

// ------------------- Load Doctor Appointments -------------------
async function loadDoctorAppointments(email) {
  const response = await fetch(`/doctor-appointments?email=${encodeURIComponent(email)}`);
  const data = await response.json();

  const list = document.getElementById("doctorAppointments");
  list.innerHTML = "";

  data.forEach(app => {
    const li = document.createElement("li");
    li.innerHTML = `
      <b>Patient:</b> ${app.patient_name} <br>
      <b>Time:</b> ${new Date(app.appointment_time).toLocaleString()} <br>
      <b>Status:</b> ${app.status}
      ${app.status === 'Pending' ? `
        <div>
          <button onclick="updateAppointment(${app.id}, 'Confirmed')">Confirm</button>
          <button onclick="updateAppointment(${app.id}, 'Cancelled')">Cancel</button>
        </div>
      ` : ''}
    `;
    list.appendChild(li);
  });
}

// ------------------- Update Appointment Status -------------------
async function updateAppointment(id, status) {
  const response = await fetch("/update-appointment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status })
  });

  const data = await response.json();
  if (data.success) {
    showToast(`✅ Appointment ${status}`, "success");
    // Refresh doctor appointments immediately
    const email = document.getElementById("doctorEmail").value;
    if (email) loadDoctorAppointments(email);
  } else {
    showToast("❌ Failed to update appointment", "error");
  }
}
