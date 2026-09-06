const express = require("express");

const router = express.Router();

const { requireRole } = require('../Middleware/auth');
const { showProductsCustomer } = require("../Controllers/CustomerController");

// صفحة منتجات الزبون
router.get("/products", requireRole('customer'), showProductsCustomer);

module.exports = router;