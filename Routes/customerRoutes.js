const express = require("express");

const router = express.Router();

const {requireRole,requireCustomerOrGuest,} = require("../Middleware/auth");

const {showProductsCustomer,showOrderDetailsCustomer,} = require("../Controllers/CustomerController");

// =====================================================
// صفحة منتجات الزبون / الزائر
// =====================================================

router.get("/products",requireCustomerOrGuest,showProductsCustomer,);

// =====================================================
// تفاصيل طلب الزبون
// =====================================================

router.get("/orders/:id",requireRole("customer"),showOrderDetailsCustomer,);

// =====================================================
// الدخول كزائر
// =====================================================

router.get("/guest", (req, res) => {
  req.session.isGuest = true;

  delete req.session.userId;
  delete req.session.userName;
  delete req.session.role;

  res.redirect("/products");
});

module.exports = router;

module.exports = router;