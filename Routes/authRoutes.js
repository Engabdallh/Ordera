const express = require("express");

const router = express.Router();

const {showLoginPage,login,register,showRegisterPage,logout} = require("../Controllers/AuthController");


router.get("/login", showLoginPage);

router.post("/login", login);

router.post("/registration", register);

router.get("/logout", logout);

router.get("/register", showRegisterPage);

module.exports = router;