let currentUser = null;

// ✅ Toast Notification
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

//
// ------------------ PATIENT FUNCTIONS ------------------
//

// Patient Sign Up
async function signup() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if (!name || !email || !password)
    return showToast("⚠️ All fields are required", "error");

  const res = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (data.success) {
    showToast("✅ Registration successful! Please log in.", "success");
    setTimeout(() => (window.location.href = "patient-login.html"), 1000);
  } else {
    showToast("❌ " + data.error, "error");
  }
}

// Patient Login → Send OTP
async function login() {
  const email = document.getElementById("patientEmail").value;
  const password = document.getElementById("patientPassword").value;

  if (!email || !password)
    return showToast("⚠️ Enter email & password", "error");

  const res = await fetch("/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (data.success) {
    currentUser = { email };
    document.getElementById("otpSection").classList.remove("hidden");
    showToast("✅ OTP sent to your email!", "success");
  } else {
    showToast("❌ " + data.error, "error");
  }
}

// Patient Verify OTP → Redirect to Dashboard
async function verifyOTP() {
  const otpInput = document.getElementById("otpInput").value;
  const email = currentUser?.email;

  if (!otpInput || !email) return showToast("⚠️ Enter OTP", "error");

  const res = await fetch("/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp: otpInput }),
  });

  const data = await res.json();
  if (data.success) {
    showToast("✅ OTP verified! Redirecting...", "success");
    setTimeout(() => (window.location.href = "patient-dashboard.html"), 1000);
  } else {
    showToast("❌ " + data.error, "error");
  }
}

//
// ------------------ DOCTOR FUNCTIONS ------------------
//

// Doctor Sign Up
async function doctorSignup() {
  const name = document.getElementById("doctorName").value;
  const specialization = document.getElementById("doctorSpec").value;
  const email = document.getElementById("doctorSignupEmail").value;
  const password = document.getElementById("doctorSignupPassword").value;

  if (!name || !specialization || !email || !password)
    return showToast("⚠️ All fields are required", "error");

  const res = await fetch("/doctor/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, specialization, email, password }),
  });

  const data = await res.json();
  if (data.success) {
    showToast("✅ Doctor registered successfully!", "success");
    setTimeout(() => (window.location.href = "doctor-login.html"), 1000);
  } else {
    showToast("❌ " + data.error, "error");
  }
}

// Doctor Login → Send OTP
async function doctorLogin() {
  const email = document.getElementById("doctorEmail").value;
  const password = document.getElementById("doctorPassword").value;

  if (!email || !password)
    return showToast("⚠️ Enter email & password", "error");

  const res = await fetch("/doctor/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (data.success) {
    currentUser = { email };
    document.getElementById("doctorOtpSection").classList.remove("hidden");
    showToast("✅ OTP sent to your email!", "success");
  } else {
    showToast("❌ " + data.error, "error");
  }
}

// Doctor Verify OTP → Redirect to Dashboard
async function verifyDoctorOTP() {
  const otpInput = document.getElementById("doctorOtpInput").value;
  const email = currentUser?.email;

  if (!otpInput || !email) return showToast("⚠️ Enter OTP", "error");

  const res = await fetch("/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp: otpInput }),
  });

  const data = await res.json();
  if (data.success) {
    showToast("✅ Doctor OTP verified! Redirecting...", "success");
    setTimeout(() => (window.location.href = "doctor-dashboard.html"), 1000);
  } else {
    showToast("❌ " + data.error, "error");
  }
}

//
// ------------------ PATIENT DASHBOARD ------------------
//

function bookAppointment() {
  const doctorId = document.getElementById("doctorId").value;
  const date = document.getElementById("appointmentDate").value;
  if (!doctorId || !date) return showToast("⚠️ Fill all fields", "error");

  const list = document.getElementById("appointmentsList");
  const li = document.createElement("li");
  li.textContent = `Doctor ${doctorId} | ${new Date(date).toLocaleString()}`;
  list.appendChild(li);

  showToast("✅ Appointment booked!", "success");
}
