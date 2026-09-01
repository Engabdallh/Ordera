const express = require("express");

const router = express.Router();

const orderController =
    require("../Controllers/OrderController");


// سجل طلبات الزبون

router.get(
    "/orders",
    orderController.showCustomerOrders
);


module.exports = router;