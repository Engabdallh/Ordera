const express = require("express");

const router = express.Router();

const {
  showLoginPage,
  login,
  register,
  showRegisterPage,
  logout,
} = require("../Controllers/AuthController");

router.get("/login", showLoginPage);

router.post("/login", login);

router.post("/registration", register);

router.get("/logout", logout);

router.get("/register", showRegisterPage);

// =========================================
// Register Help
// شرح إنشاء الحساب
// =========================================

router.get("/register-help", (req, res) => {
  return res.render("register-help");
});


// =========================================
// Login Help
// مساعدة تسجيل الدخول
// =========================================

router.get("/login-help", (req, res) => {
  return res.render("login-help");
});

module.exports = router;
