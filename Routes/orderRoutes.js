const express = require("express");

const router = express.Router();

const { requireRole } = require("../Middleware/auth");

const orderController = require("../Controllers/OrderController");

// سجل طلبات الزبون
router.get(
  "/orders",
  requireRole("customer"),
  orderController.showCustomerOrders,
);

module.exports = router;
