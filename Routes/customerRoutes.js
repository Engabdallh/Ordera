const express = require("express");

const router = express.Router();

const {showProductsCustomer} = require("../Controllers/CustomerController");

// صفحة منتجات الزبون

router.get("/products",showProductsCustomer);

module.exports = router;