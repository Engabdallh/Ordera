const ProductService = require("../Services/ProductService");
const RestaurantService = require("../Services/RestaurantService");
const CheckoutService = require("../Services/CheckoutService");
const CouponService = require("../Services/CouponService");

const productService = new ProductService();
const restaurantService = new RestaurantService();
const checkoutService = new CheckoutService();
const couponService = new CouponService();

// =====================================================
// التحقق أن المستخدم Customer
// =====================================================

// =====================================================
// التحقق من أن المستخدم Customer أو Guest
// =====================================================

const checkCustomer = (req, res) => {
  const isCustomer = req.session?.userId && req.session?.role === "customer";

  const isGuest = req.session?.isGuest === true;

  if (!isCustomer && !isGuest) {
    res.redirect("/");
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

    const restaurant = await restaurantService.getRestaurantStatus();

    if (!restaurant || !restaurant.is_open) {
      return res.redirect("/products?reason=restaurant_closed");
    }

    const productId = parseInt(req.body.productId);

    if (!productId) {
      return res.status(400).send("رقم المنتج غير صحيح");
    }

    // ==============================
    // البحث عن المنتج
    // ==============================

    const product = await productService.getProductById(productId);

    if (!product) {
      return res.status(404).send("المنتج غير موجود");
    }

    // ==============================
    // التحقق من توفر المنتج
    // ==============================

    if (!product.is_available) {
      return res.redirect(
        `/products?reason=product_unavailable&product=${encodeURIComponent(product.name)}`,
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

    const existingProduct = req.session.cart.find(
      (item) => item.productId === productId,
    );

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      req.session.cart.push({
        productId: product.id,

        name: product.name,

        price: product.price,

        image: product.image,

        quantity: 1,
      });
    }

    delete req.session.coupon;

    res.redirect("/cart");
  } catch (error) {
    console.error("ADD TO CART ERROR:", error);

    res.status(500).send("حدث خطأ أثناء إضافة المنتج");
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

    const cart = req.session.cart || [];

    res.render("Customer/cart", {
      cart: cart,

      userName: req.session.isGuest ? "زائر" : req.session.userName,

      isGuest: req.session.isGuest === true,

      coupon: req.session.coupon || null,

      couponError: req.query.couponError || null,

      couponSuccess: req.query.couponSuccess || null,
    });
  } catch (error) {
    console.error("SHOW CART ERROR:", error);

    res.status(500).send("حدث خطأ أثناء عرض السلة");
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

    const productId = parseInt(req.params.id);

    const cart = req.session.cart || [];

    const product = cart.find((item) => item.productId === productId);

    if (!product) {
      return res.status(404).send("المنتج غير موجود في السلة");
    }

    product.quantity += 1;

    delete req.session.coupon;

    res.redirect("/cart");
  } catch (error) {
    console.error("INCREASE ERROR:", error);

    res.status(500).send("حدث خطأ أثناء زيادة الكمية");
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

    const productId = parseInt(req.params.id);

    const cart = req.session.cart || [];

    const product = cart.find((item) => item.productId === productId);

    if (!product) {
      return res.status(404).send("المنتج غير موجود في السلة");
    }

    if (product.quantity > 1) {
      product.quantity -= 1;
    } else {
      req.session.cart = cart.filter((item) => item.productId !== productId);
    }

    delete req.session.coupon;

    res.redirect("/cart");
  } catch (error) {
    console.error("DECREASE ERROR:", error);

    res.status(500).send("حدث خطأ أثناء إنقاص الكمية");
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

    const productId = parseInt(req.params.id);

    const cart = req.session.cart || [];

    req.session.cart = cart.filter((item) => item.productId !== productId);

    delete req.session.coupon;

    res.redirect("/cart");
  } catch (error) {
    console.error("REMOVE CART ERROR:", error);

    res.status(500).send("حدث خطأ أثناء حذف المنتج");
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

    delete req.session.coupon;

    res.redirect("/cart");
  } catch (error) {
    console.error("CLEAR CART ERROR:", error);

    res.status(500).send("حدث خطأ أثناء تفريغ السلة");
  }
};

// =====================================================
// تطبيق كوبون الخصم
// =====================================================

const applyCoupon = async (req, res) => {
  try {
    if (!checkCustomer(req, res)) {
      return;
    }

    const code = String(req.body.code || "").trim();

    if (!code) {
      return res.redirect(
        "/cart?couponError=" + encodeURIComponent("أدخل كود الخصم"),
      );
    }

    const cart = req.session.cart || [];

    if (cart.length === 0) {
      return res.redirect(
        "/cart?couponError=" + encodeURIComponent("السلة فارغة"),
      );
    }

    // =============================================
    // إعادة حساب subtotal من قاعدة البيانات
    // =============================================

    let subtotal = 0;

    for (const item of cart) {
      const product = await productService.getProductById(item.productId);

      if (!product) {
        return res.redirect(
          "/cart?couponError=" +
            encodeURIComponent(`المنتج "${item.name}" غير موجود`),
        );
      }

      const quantity = Number(item.quantity);

      const price = Number(product.price);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.redirect(
          "/cart?couponError=" + encodeURIComponent("بيانات السلة غير صحيحة"),
        );
      }

      subtotal += price * quantity;
    }

    subtotal = Number(subtotal.toFixed(2));

    // =============================================
    // التحقق من الكوبون
    // =============================================

    const result = await couponService.validateCoupon(
      code,
      subtotal,
      req.session.userId,
    );

    if (!result.valid) {
      // إزالة الكوبون القديم إذا كان موجودًا
      delete req.session.coupon;

      return res.redirect(
        "/cart?couponError=" + encodeURIComponent(result.message),
      );
    }

    // =============================================
    // حفظ الكوبون في Session
    // =============================================

    req.session.coupon = {
      couponId: result.couponId,

      couponCode: result.couponCode,

      discountType: result.discountType,

      discountValue: result.discountValue,

      discountAmount: result.discountAmount,

      subtotal: result.subtotal,

      totalPrice: result.totalPrice,
    };

    return res.redirect(
      "/cart?couponSuccess=" +
        encodeURIComponent(`تم تطبيق الكوبون ${result.couponCode}`),
    );
  } catch (error) {
    console.error("APPLY COUPON ERROR:", error);

    return res.status(500).send("حدث خطأ أثناء تطبيق الكوبون");
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
    // تحديد نوع المستخدم
    // ==============================

    const isCustomer = req.session?.userId && req.session?.role === "customer";

    const isGuest = req.session?.isGuest === true;

    // ==============================
    // التحقق من حالة المطعم
    // ==============================

    const restaurant = await restaurantService.getRestaurantStatus();

    if (!restaurant || !restaurant.is_open) {
      return res.redirect("/products?reason=restaurant_closed");
    }

    // ==============================
    // بيانات الطلب
    // ==============================

    const guestName = String(req.body.guestName || "").trim();

    const phone = String(req.body.phone || "").trim();

    const address = String(req.body.address || "").trim();

    const cart = req.session.cart || [];

    // ==============================
    // التحقق من البيانات
    // ==============================

    if (isGuest && !guestName) {
      return res.status(400).send("اسم الزائر مطلوب");
    }

    if (!phone || !address) {
      return res.status(400).send("رقم الهاتف والعنوان مطلوبان");
    }

    if (cart.length === 0) {
      return res.redirect("/cart");
    }

    // ==============================
    // التحقق من المنتجات مرة أخرى
    // ==============================

    for (const item of cart) {
      const product = await productService.getProductById(item.productId);

      if (!product) {
        return res.status(404).send(`المنتج "${item.name}" غير موجود`);
      }

      if (!product.is_available) {
        return res.redirect(
          `/products?reason=product_unavailable&product=${encodeURIComponent(
            product.name,
          )}`,
        );
      }
    }

    // ==============================
    // إنشاء الطلب
    // ==============================

    const order = await checkoutService.createOrder({
      customerId: isCustomer ? req.session.userId : null,

      guestName: isGuest ? guestName : null,

      phone,

      address,

      cart,

      // الزائر لا يستخدم كوبونات
      couponCode: isCustomer ? req.session.coupon?.couponCode || null : null,
    });

    // ==============================
    // تنظيف السلة والجلسة
    // ==============================

    req.session.cart = [];

    delete req.session.coupon;

    // ==============================
    // صفحة نجاح الطلب
    // ==============================

    return res.render("Customer/ordersuccess", {
      orderId: order.orderId,

      dailyOrderNumber: order.dailyOrderNumber,

      totalPrice: Number(order.totalPrice).toFixed(2),

      phone,

      address,

      guestName: isGuest ? guestName : null,
      guestTrackingToken: order.guestTrackingToken,
    });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);

    return res.status(500).send(error.message || "حدث خطأ أثناء تأكيد الطلب");
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

  applyCoupon,

  checkout,
};
