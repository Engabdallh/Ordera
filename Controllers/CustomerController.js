const ProductService = require("../Services/ProductService");

const productService = new ProductService();


// ==============================
// عرض منتجات الزبون
// ==============================

const showProductsCustomer = async (req, res) => {

    try {

        console.log("Customer ID:", req.session.userId);
        console.log("Customer Name:", req.session.userName);
        console.log("Customer Role:", req.session.role);

        if (!req.session.userId || req.session.role !== "customer") {
            return res.redirect("/login");
        }

        const products =
            await productService.getAllProducts();

        res.render("customer/showproductscostmer", {
            products: products,
            userName: req.session.userName
        });

    } catch (error) {

        console.error(error);

        res.status(500).send("حدث خطأ في الخادم");
    }
};


module.exports = {
    showProductsCustomer
};