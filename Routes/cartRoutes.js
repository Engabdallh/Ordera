const express = require("express");

const router = express.Router();

const cartController = require("../Controllers/CartController");

// إضافة منتج للسلة
router.post("/add",cartController.addToCart);

// عرض السلة
router.get("/",cartController.showCart);

// زيادة الكمية
router.post("/increase/:id",cartController.increaseQuantity);

// إنقاص الكمية
router.post("/decrease/:id",cartController.decreaseQuantity);

// حذف منتج
router.post("/remove/:id",cartController.removeFromCart);

// تفريغ السلة
router.post("/clear",cartController.clearCart);

router.get(
    "/cart/confirm",
    cartController.showConfirmOrder
);

router.post("/checkout",cartController.checkout);

module.exports = router;