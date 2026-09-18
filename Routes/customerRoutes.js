const express = require("express");

const router = express.Router();

const { requireRole } = require("../Middleware/auth");
const { showProductsCustomer, showOrderDetailsCustomer } = require("../Controllers/CustomerController");

// صفحة منتجات الزبون
router.get("/products", requireRole("customer"), showProductsCustomer);

router.get("/orders/:id",requireRole("customer"),showOrderDetailsCustomer,);

module.exports = router;
