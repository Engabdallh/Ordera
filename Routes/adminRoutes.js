const express = require("express");
const router = express.Router();

const productController = require("../Controllers/ProductController");
const adminController = require("../Controllers/AdminController");
const upload = require("../Middleware/upload");
const { requireRole } = require("../Middleware/auth");

// Everything under /admin requires an authenticated admin account.
router.use(requireRole("admin"));

router.get("/", adminController.showDashboard);

router.post("/restaurant/toggle", adminController.toggleRestaurantStatus);

router.get("/orders", adminController.showOrders);

router.get("/orders/:id", adminController.showOrderDetails);

router.get("/products", productController.showProductsPage);

router.get("/products/add", (req, res) => res.render("admin/add-product"));

router.post(
  "/products",
  upload.single("image"),
  productController.createProduct,
);

router.get("/products/edit/:id", productController.showEditProductPage);

router.post(
  "/products/edit/:id",
  upload.single("image"),
  productController.updateProduct,
);

router.post("/products/delete/:id", productController.deleteProduct);

router.post(
  "/products/toggle/:id",
  productController.toggleProductAvailability,
);

module.exports = router;
