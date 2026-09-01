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

const checkout = async (req, res) => {

    try {

        // =========================================
        // التأكد أن المستخدم Customer ومسجل دخول
        // =========================================

        if (
            !req.session.userId ||
            req.session.role !== "customer"
        ) {
            return res.redirect("/login");
        }


        const customerId = req.session.userId;


        // =========================================
        // استقبال رقم الهاتف والعنوان
        // =========================================

        const {
            phone,
            address
        } = req.body;


        // =========================================
        // التحقق من البيانات
        // =========================================

        if (!phone || !address) {

            return res.status(400).send(
                "رقم الهاتف والعنوان مطلوبان"
            );

        }


        // =========================================
        // جلب السلة
        // =========================================

        const cart =
            req.session.cart || [];


        if (cart.length === 0) {

            return res.redirect("/cart");

        }


        // =========================================
        // حساب المجموع
        // =========================================

        let totalPrice = 0;


        for (const item of cart) {

            totalPrice +=
                Number(item.price) *
                Number(item.quantity);

        }


        // =========================================
        // تحديث رقم الهاتف والعنوان للعميل
        // =========================================

        await db.query(
            `UPDATE customers
             SET phone = ?,
                 address = ?
             WHERE id = ?`,
            [
                phone,
                address,
                customerId
            ]
        );


        console.log(
            "CUSTOMER DATA UPDATED:",
            customerId
        );


        // =========================================
        // إنشاء الطلب
        // =========================================

    

const [orderResult] = await db.query(
    `INSERT INTO orders
    (
        customer_id,
        total_price,
        status,
        order_type,
        delivery_phone,
        delivery_address
    )
    VALUES (?, ?, 'قيد الانتظار', 'الموقع', ?, ?)`,
    [
        customerId,
        totalPrice.toFixed(2),
        phone,
        address
    ]
);


        const orderId =
            orderResult.insertId;


        console.log(
            "ORDER CREATED:",
            orderId
        );


        // =========================================
        // إضافة المنتجات إلى order_items
        // =========================================

        for (const item of cart) {

            await db.query(
                `INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    quantity,
                    price
                )
                VALUES (?, ?, ?, ?)`,
                [
                    orderId,
                    item.productId,
                    item.quantity,
                    item.price
                ]
            );

        }


        // =========================================
        // تفريغ السلة
        // =========================================

        req.session.cart = [];


        // =========================================
        // صفحة نجاح الطلب
        // =========================================

        res.render(
            "customer/ordersuccess",
            {
                orderId: orderId,
                totalPrice:
                    totalPrice.toFixed(2),
                phone: phone,
                address: address
            }
        );


    } catch (error) {

        console.error(
            "CHECKOUT ERROR:",
            error
        );


        res.status(500).send(
            "حدث خطأ أثناء تأكيد الطلب"
        );

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

        res.render("customer/confirm-order", {

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