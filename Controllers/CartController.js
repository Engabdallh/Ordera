const ProductService = require("../Services/ProductService");
const RestaurantService = require("../Services/RestaurantService");
const CheckoutService = require("../Services/CheckoutService");

const productService = new ProductService();
const restaurantService = new RestaurantService();
const checkoutService = new CheckoutService();


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


        // ==============================
        // التحقق من حالة المطعم
        // ==============================

        const restaurant =
            await restaurantService.getRestaurantStatus();

        if (!restaurant || !restaurant.is_open) {

         return res.redirect("/products?reason=restaurant_closed");

     }


        const productId =
            parseInt(req.body.productId);


        if (!productId) {

            return res.status(400).send(
                "رقم المنتج غير صحيح"
            );

        }


        // ==============================
        // البحث عن المنتج
        // ==============================

        const product =
            await productService.getProductById(productId);


        if (!product) {

            return res.status(404).send(
                "المنتج غير موجود"
            );

        }


        // ==============================
        // التحقق من توفر المنتج
        // ==============================

        if (!product.is_available) {
         return res.redirect(
        `/products?reason=product_unavailable&product=${encodeURIComponent(product.name)}`
        );
}


        // ==============================
        // إنشاء السلة
        // ==============================

        if (!req.session.cart) {

            req.session.cart = [];

        }


        // ==============================
        // البحث هل المنتج موجود مسبقاً
        // ==============================

        const existingProduct =
            req.session.cart.find(
                item => item.productId === productId
            );


        if (existingProduct) {

            existingProduct.quantity += 1;

        } else {

            req.session.cart.push({

                productId: product.id,

                name: product.name,

                price: product.price,

                image: product.image,

                quantity: 1

            });

        }


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


        if (product.quantity > 1) {

            product.quantity -= 1;

        } else {

            req.session.cart =
                cart.filter(
                    item => item.productId !== productId
                );

        }


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


// =====================================================
// تأكيد الطلب
// =====================================================

const checkout = async (req, res) => {

    try {

        if (!checkCustomer(req, res)) {
            return;
        }


        // ==============================
        // التحقق من حالة المطعم
        // ==============================

        const restaurant =
            await restaurantService.getRestaurantStatus();


        if (!restaurant || !restaurant.is_open) {

        return res.redirect("/products?reason=restaurant_closed");
      }


        const phone =
            String(req.body.phone || "").trim();


        const address =
            String(req.body.address || "").trim();


        const cart =
            req.session.cart || [];


        if (!phone || !address) {

            return res.status(400).send(
                "رقم الهاتف والعنوان مطلوبان"
            );

        }


        if (cart.length === 0) {

            return res.redirect("/cart");

        }


        // ==============================
        // التحقق من المنتجات مرة أخرى
        // ==============================

        for (const item of cart) {

            const product =
                await productService.getProductById(
                    item.productId
                );


            if (!product) {

                return res.status(404).send(
                    `المنتج "${item.name}" غير موجود`
                );

            }


            if (!product.is_available) {

           return res.redirect(
           `/products?reason=product_unavailable&product=${encodeURIComponent(product.name)}`
         );

}

        }


        // ==============================
        // إنشاء الطلب
        // ==============================

        const order =
            await checkoutService.createOrder({

                customerId:
                    req.session.userId,

                phone,

                address,

                cart

            });


        req.session.cart = [];


        return res.render(
            "customer/ordersuccess",
            {
                orderId: order.orderId,

                totalPrice:
                    Number(order.totalPrice).toFixed(2),

                phone,

                address
            }
        );


    } catch (error) {

        console.error(
            "CHECKOUT ERROR:",
            error
        );

        return res.status(500).send(
            "حدث خطأ أثناء تأكيد الطلب"
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

    checkout

};