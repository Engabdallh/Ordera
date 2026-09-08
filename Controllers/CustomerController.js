const ProductService = require("../Services/ProductService");
const RestaurantService = require("../Services/RestaurantService");

const productService = new ProductService();
const restaurantService = new RestaurantService();

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

    // ==============================
    // قراءة سبب الرجوع للصفحة
    // ==============================

    const reason =
        req.query.reason || null;

    const productName =
        req.query.product || null;


    // ==============================
    // التحقق من حالة المطعم
    // ==============================

    const restaurant =
        await restaurantService.getRestaurantStatus();


    // ==============================
    // المطعم مغلق
    // ==============================

    if (!restaurant || !restaurant.is_open) {

        return res.render(
            "customer/showproductscostmer",
            {
                products: [],
                userName: req.session.userName,
                restaurantOpen: false,
                queryReason: reason,
                unavailableProduct: productName
            }
        );

    }


    // ==============================
    // المطعم شغال
    // ==============================

    const products =
        await productService.getAvailableProducts();


    return res.render(
        "customer/showproductscostmer",
        {
            products: products,
            userName: req.session.userName,
            restaurantOpen: true,
            queryReason: reason,
            unavailableProduct: productName
        }
    );

} catch (error) {

    console.error(
        "CUSTOMER PRODUCTS ERROR:",
        error
    );

    return res.status(500).send(
        "حدث خطأ في الخادم"
    );
}

};

module.exports = {
showProductsCustomer
};