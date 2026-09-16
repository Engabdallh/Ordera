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

router.get("/products/add", (req, res) => {
  const success = req.query.success;

  res.render("admin/add-product", {
    success,
  });
});

router.post(
  "/products",
  upload.single("image"),
  productController.createProduct,
);

router.get("/products/edit/:id", (req, res) => {
  productController.showEditProductPage(req, res);
});

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

router.get("/call-center-agents", adminController.showCallCenterAgents);

router.post("/call-center-agents", adminController.createCallCenterAgent);

router.post(
  "/call-center-agents/delete/:id",
  adminController.deleteCallCenterAgent,
);

router.post(
  "/call-center-agents/toggle/:id",
  adminController.toggleCallCenterAgentStatus,
);

router.post(
  "/call-center-agents/edit/:id",
  adminController.updateCallCenterAgent,
);

router.get(
  "/call-center-agents/edit/:id",
  adminController.showEditCallCenterAgent,
);

module.exports = router;
