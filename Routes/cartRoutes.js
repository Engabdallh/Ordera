const express = require("express");

const router = express.Router();

const { requireRole } = require("../Middleware/auth");

const { requireCustomerOrGuest } = require("../Middleware/auth");

router.use(requireCustomerOrGuest);

const cartController = require("../Controllers/CartController");

// إضافة منتج للسلة
router.post("/add", cartController.addToCart);

// عرض السلة
router.get("/", cartController.showCart);

// زيادة الكمية
router.post("/increase/:id", cartController.increaseQuantity);

// إنقاص الكمية
router.post("/decrease/:id", cartController.decreaseQuantity);

// حذف منتج
router.post("/remove/:id", cartController.removeFromCart);

// تفريغ السلة
router.post("/clear", cartController.clearCart);

// تطبيق كوبون الخصم
router.post("/apply-coupon", cartController.applyCoupon);

// تأكيد الطلب
router.post("/checkout", cartController.checkout);

module.exports = router;
