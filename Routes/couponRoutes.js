const express = require("express");

const router = express.Router();

const { requireRole } = require("../Middleware/auth");

const couponController = require("../Controllers/CouponController");

// ==============================
// حماية Routes الخاصة بالـ Admin
// ==============================

router.use(requireRole("admin"));

// ==============================
// عرض الكوبونات
// ==============================

router.get("/", couponController.showCoupons);

// ==============================
// إضافة كوبون
// ==============================

router.post("/", couponController.createCoupon);

// ==============================
// تفعيل / تعطيل كوبون
// ==============================

router.post("/toggle/:id", couponController.toggleCoupon);

// ==============================
// حذف كوبون
// ==============================

router.post("/delete/:id", couponController.deleteCoupon);

module.exports = router;
