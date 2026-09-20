const ProductService = require("../Services/ProductService");
const RestaurantService = require("../Services/RestaurantService");
const OrderService = require("../Services/OrderService");

const productService = new ProductService();
const restaurantService = new RestaurantService();
const orderService = new OrderService();

// ==============================
// عرض منتجات الزبون
// ==============================

// ==============================
// عرض منتجات الزبون / الزائر
// ==============================

const showProductsCustomer = async (req, res) => {
  try {
    const isCustomer = req.session?.userId && req.session?.role === "customer";

    const isGuest = req.session?.isGuest === true;

    console.log("Customer ID:", req.session?.userId);
    console.log("Customer Name:", req.session?.userName);
    console.log("Customer Role:", req.session?.role);
    console.log("Guest:", isGuest);

    // يجب أن يكون المستخدم زبونًا أو زائرًا
    if (!isCustomer && !isGuest) {
      return res.redirect("/");
    }

    // ==============================
    // اسم المستخدم
    // ==============================

    const userName = isGuest ? "زائر" : req.session.userName;

    // ==============================
    // قراءة سبب الرجوع للصفحة
    // ==============================

    const reason = req.query.reason || null;

    const productName = req.query.product || null;

    // ==============================
    // التحقق من حالة المطعم
    // ==============================

    const restaurant = await restaurantService.getRestaurantStatus();

    // ==============================
    // المطعم مغلق
    // ==============================

    if (!restaurant || !restaurant.is_open) {
      return res.render("Customer/showproductscostmer", {
        products: [],
        userName,
        isGuest,
        restaurantOpen: false,
        queryReason: reason,
        unavailableProduct: productName,
      });
    }

    // ==============================
    // المطعم شغال
    // ==============================

    const products = await productService.getAvailableProducts();

    return res.render("Customer/showproductscostmer", {
      products,
      userName,
      isGuest,
      restaurantOpen: true,
      queryReason: reason,
      unavailableProduct: productName,
    });
  } catch (error) {
    console.error("CUSTOMER PRODUCTS ERROR:", error);

    return res.status(500).send("حدث خطأ في الخادم");
  }
};

// ==============================
// عرض تفاصيل طلب الزبون
// ==============================

const showOrderDetailsCustomer = async (req, res) => {
  try {
    if (!req.session.userId || req.session.role !== "customer") {
      return res.redirect("/login");
    }

    const orderId = Number(req.params.id);

    if (!orderId) {
      return res.status(400).send("رقم الطلب غير صحيح");
    }

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).send("الطلب غير موجود");
    }

    // الزبون يستطيع مشاهدة طلباته فقط
    if (Number(order.customer_id) !== Number(req.session.userId)) {
      return res.status(403).send("غير مصرح لك بمشاهدة هذا الطلب");
    }

    const items = await orderService.getOrderItems(orderId);

    return res.render("Customer/orderdetails", {
      order,
      items,
      userName: req.session.userName,
    });
  } catch (error) {
    console.error("CUSTOMER ORDER DETAILS ERROR:", error);

    return res.status(500).send("حدث خطأ أثناء تحميل تفاصيل الطلب");
  }
};

module.exports = {
  showProductsCustomer,
  showOrderDetailsCustomer,
};
