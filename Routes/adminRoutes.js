const express = require("express");

const router = express.Router();

const productController = require("../Controllers/ProductController");

const upload = require("../Middleware/upload");

router.get("/", (req, res) => {
    res.render("admin/index");
});


router.get("/products",productController.showProductsPage);


router.get("/products/add",(req, res) => 
    {res.render("admin/add-product");});


router.post(
    "/products",
    upload.single("image"),
    productController.createProduct
);

router.get(
    "/products/edit/:id",
    productController.showEditProductPage
);


router.post(
    "/products/edit/:id",
    upload.single("image"),
    productController.updateProduct
);


router.post(
    "/products/delete/:id",
    productController.deleteProduct
);


module.exports = router;