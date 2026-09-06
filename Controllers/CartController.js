const db = require("../Database/db");

const ProductService = require("../Services/ProductService");

const productService = new ProductService();


// =====================================================
// التحقق أن المستخدم Customer
// =====================================================

const checkCustomer = (req, res) => {

    if (
        !req.session.userId ||
        req.session.role !== "customer"
    ) {
        res.redirect("/login");
        return false;
    }

    return true;
};


// =====================================================
// إضافة منتج إلى السلة
// =====================================================

const addToCart = async (req, res) => {

    try {

        if (!checkCustomer(req, res)) {
            return;
        }

        const productId = parseInt(req.body.productId);

        if (!productId) {
            return res.status(400).send(
                "رقم المنتج غير صحيح"
            );
        }


        console.log("Product ID:", productId);
        console.log(
            "Customer ID:",
            req.session.userId
        );


        // البحث عن المنتج في قاعدة البيانات

        const product =
            await productService.getProductById(productId);


        if (!product) {

            return res.status(404).send(
                "المنتج غير موجود"
            );

        }


        // إنشاء السلة إذا لم تكن موجودة

        if (!req.session.cart) {

            req.session.cart = [];

        }


        // البحث هل المنتج موجود مسبقًا

        const existingProduct =
            req.session.cart.find(
                item => item.productId === productId
            );


        if (existingProduct) {

            // المنتج موجود → زيادة الكمية

            existingProduct.quantity += 1;

        } else {

            // المنتج غير موجود → إضافته

            req.session.cart.push({

                productId: product.id,

                name: product.name,

                price: product.price,

                image: product.image,

                quantity: 1

            });

        }


        console.log(
            "CART:",
            req.session.cart
        );


        // الذهاب إلى السلة

        res.redirect("/cart");


    } catch (error) {

        console.error(
            "ADD TO CART ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء إضافة المنتج"
        );

    }

};


// =====================================================
// عرض السلة
// =====================================================

const showCart = (req, res) => {

    try {

        if (!checkCustomer(req, res)) {
            return;
        }


        const cart =
            req.session.cart || [];


        console.log(
            "CUSTOMER CART:",
            cart
        );


        res.render(
            "customer/cart",
            {
                cart: cart,
                userName: req.session.userName
            }
        );


    } catch (error) {

        console.error(
            "SHOW CART ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء عرض السلة"
        );

    }

};


// =====================================================
// زيادة كمية المنتج
// =====================================================

const increaseQuantity = (req, res) => {

    try {

        if (!checkCustomer(req, res)) {
            return;
        }


        const productId =
            parseInt(req.params.id);


        const cart =
            req.session.cart || [];


        const product =
            cart.find(
                item => item.productId === productId
            );


        if (!product) {

            return res.status(404).send(
                "المنتج غير موجود في السلة"
            );

        }


        product.quantity += 1;


        console.log(
            "INCREASE:",
            product
        );


        res.redirect("/cart");


    } catch (error) {

        console.error(
            "INCREASE ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء زيادة الكمية"
        );

    }

};


// =====================================================
// إنقاص كمية المنتج
// =====================================================

const decreaseQuantity = (req, res) => {

    try {

        if (!checkCustomer(req, res)) {
            return;
        }


        const productId =
            parseInt(req.params.id);


        const cart =
            req.session.cart || [];


        const product =
            cart.find(
                item => item.productId === productId
            );


        if (!product) {

            return res.status(404).send(
                "المنتج غير موجود في السلة"
            );

        }


        // إذا الكمية أكبر من 1 ننقصها

        if (product.quantity > 1) {

            product.quantity -= 1;

        } else {

            // إذا وصلت إلى 1 نحذف المنتج

            req.session.cart =
                cart.filter(
                    item => item.productId !== productId
                );

        }


        console.log(
            "DECREASE:",
            req.session.cart
        );


        res.redirect("/cart");


    } catch (error) {

        console.error(
            "DECREASE ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء إنقاص الكمية"
        );

    }

};


// =====================================================
// حذف منتج من السلة
// =====================================================

const removeFromCart = (req, res) => {

    try {

        if (!checkCustomer(req, res)) {
            return;
        }


        const productId =
            parseInt(req.params.id);


        const cart =
            req.session.cart || [];


        req.session.cart =
            cart.filter(
                item => item.productId !== productId
            );


        console.log(
            "REMOVE PRODUCT:",
            productId
        );


        console.log(
            "CART:",
            req.session.cart
        );


        res.redirect("/cart");


    } catch (error) {

        console.error(
            "REMOVE CART ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء حذف المنتج"
        );

    }

};


// =====================================================
// تفريغ السلة بالكامل
// =====================================================

const clearCart = (req, res) => {

    try {

        if (!checkCustomer(req, res)) {
            return;
        }


        req.session.cart = [];


        console.log(
            "CART CLEARED"
        );


        res.redirect("/cart");


    } catch (error) {

        console.error(
            "CLEAR CART ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء تفريغ السلة"
        );

    }

};

const CheckoutService = require("../Services/CheckoutService");
const checkoutService = new CheckoutService();

const checkout = async (req, res) => {
    try {
        if (!checkCustomer(req, res)) return;

        const phone = String(req.body.phone || "").trim();
        const address = String(req.body.address || "").trim();
        const cart = req.session.cart || [];

        if (!phone || !address) {
            return res.status(400).send("رقم الهاتف والعنوان مطلوبان");
        }

        if (cart.length === 0) {
            return res.redirect("/cart");
        }

        const order = await checkoutService.createOrder({
            customerId: req.session.userId,
            phone,
            address,
            cart
        });

        req.session.cart = [];

        return res.render("customer/ordersuccess", {
            orderId: order.orderId,
            totalPrice: order.totalPrice.toFixed(2),
            phone,
            address
        });
    } catch (error) {
        console.error("CHECKOUT ERROR:", error);
        return res.status(500).send("حدث خطأ أثناء تأكيد الطلب");
    }
};

const showConfirmOrder = (req, res) => {

    try {

        if (!checkCustomer(req, res)) {
            return;
        }

        const cart = req.session.cart || [];

        if (cart.length === 0) {
            return res.redirect("/cart");
        }

        res.render("customer/confirmorder", {

            userName: req.session.userName

        });

    } catch (error) {

        console.error(
            "SHOW CONFIRM ORDER ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء فتح صفحة تأكيد الطلب"
        );

    }

};

// =====================================================
// Export
// =====================================================

module.exports = {

    addToCart,

    showCart,

    increaseQuantity,

    decreaseQuantity,

    removeFromCart,

    clearCart,

    showConfirmOrder,

    checkout

};