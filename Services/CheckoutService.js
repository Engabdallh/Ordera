const db = require("../Database/db");

class CheckoutService {
  async createOrder({ customerId, phone, address, cart, couponCode = null }) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Never trust prices stored in the session. Re-read products from DB.
      const productIds = [
        ...new Set(
          cart.map((item) => Number(item.productId)).filter(Number.isInteger),
        ),
      ];

      if (productIds.length === 0) {
        throw new Error("السلة غير صالحة");
      }

      const placeholders = productIds.map(() => "?").join(",");
      const [products] = await connection.query(
        `SELECT id, name, price, image
                 FROM products
                 WHERE id IN (${placeholders})`,
        productIds,
      );

      const productMap = new Map(
        products.map((product) => [Number(product.id), product]),
      );
      let subtotal = 0;
      const normalizedItems = [];

      for (const item of cart) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);
        const product = productMap.get(productId);

        if (!product) {
          throw new Error(`المنتج رقم ${productId} غير موجود`);
        }

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
          throw new Error("كمية المنتج غير صحيحة");
        }

        const price = Number(product.price);
        if (!Number.isFinite(price) || price < 0) {
          throw new Error("سعر المنتج غير صالح");
        }

        subtotal += price * quantity;
        normalizedItems.push({ productId, quantity, price });
      }

      subtotal = Number(subtotal.toFixed(2));

      // ==============================
      // حساب خصم الكوبون والسعر النهائي
      // ==============================

      // ==============================
      // حساب خصم الكوبون والتحقق من الحدود
      // ==============================

      let discountAmount = 0;
      let appliedCouponCode = null;
      let appliedCouponId = null;

      if (couponCode) {
        const cleanCouponCode = String(couponCode).trim().toUpperCase();

        const [couponRows] = await connection.query(
          `SELECT *
         FROM coupons
         WHERE code = ?
         AND is_active = 1
         LIMIT 1`,
          [cleanCouponCode],
        );

        if (couponRows.length > 0) {
          const coupon = couponRows[0];

          // ==============================
          // التحقق من انتهاء الصلاحية
          // ==============================

          const isExpired =
            coupon.expires_at && new Date(coupon.expires_at) < new Date();

          if (isExpired) {
            throw new Error("انتهت صلاحية كود الخصم");
          }

          // ==============================
          // التحقق من الحد الأدنى للطلب
          // ==============================

          const minimumOrder = Number(coupon.min_order_amount || 0);

          if (subtotal < minimumOrder) {
            throw new Error(
              `الحد الأدنى لاستخدام هذا الكوبون هو ${minimumOrder.toFixed(2)} د.أ`,
            );
          }

          // ==============================
          // التحقق من الحد الإجمالي
          // ==============================

          if (coupon.usage_limit !== null) {
            const [totalUsageRows] = await connection.query(
              `SELECT COUNT(*) AS usageCount
                     FROM coupon_usages
                     WHERE coupon_id = ?`,
              [coupon.id],
            );

            if (
              Number(totalUsageRows[0].usageCount) >= Number(coupon.usage_limit)
            ) {
              throw new Error("تم الوصول إلى الحد الأقصى لاستخدام هذا الكوبون");
            }
          }

          // ==============================
          // التحقق من حد العميل
          // ==============================

          if (coupon.usage_limit_per_customer !== null) {
            const [customerUsageRows] = await connection.query(
              `SELECT COUNT(*) AS usageCount
                     FROM coupon_usages
                     WHERE coupon_id = ?
                     AND customer_id = ?`,
              [coupon.id, customerId],
            );

            if (
              Number(customerUsageRows[0].usageCount) >=
              Number(coupon.usage_limit_per_customer)
            ) {
              throw new Error("لقد وصلت إلى الحد الأقصى لاستخدام هذا الكوبون");
            }
          }

          // ==============================
          // حساب الخصم
          // ==============================

          if (coupon.discount_type === "percentage") {
            discountAmount = subtotal * (Number(coupon.discount_value) / 100);
          } else if (coupon.discount_type === "fixed") {
            discountAmount = Number(coupon.discount_value);
          }

          discountAmount = Math.min(discountAmount, subtotal);

          discountAmount = Number(discountAmount.toFixed(2));

          appliedCouponCode = coupon.code;
          appliedCouponId = coupon.id;
        }
      }

      const totalPrice = Number((subtotal - discountAmount).toFixed(2));

      // ==============================
      // التحقق من حالة المطعم ودورة الـ24 ساعة
      // ==============================

      const [restaurantRows] = await connection.query(
        `SELECT is_open, cycle_started_at
   FROM restaurant_settings
   WHERE id = 1`,
      );

      const restaurant = restaurantRows[0];

      if (!restaurant || !restaurant.is_open) {
        throw new Error("المطعم مغلق حاليًا");
      }

      const cycleStartedAt = new Date(restaurant.cycle_started_at);

      const cycleExpiresAt = new Date(
        cycleStartedAt.getTime() + 24 * 60 * 60 * 1000,
      );

      if (new Date() >= cycleExpiresAt) {
        throw new Error("انتهت دورة المطعم الحالية");
      }

      // ==============================
      // توليد رقم الطلب داخل دورة الـ24 ساعة
      // ==============================

      const [dailyOrderRows] = await connection.query(
        `SELECT COUNT(*) AS orderCount
   FROM orders
   WHERE created_at >= ?
   AND created_at < ?`,
        [cycleStartedAt, cycleExpiresAt],
      );

      const dailyOrderNumber = Number(dailyOrderRows[0].orderCount) + 1;

      await connection.query(
        `UPDATE customers
                 SET phone = ?, address = ?
                 WHERE id = ?`,
        [phone, address, customerId],
      );

      // ==============================
      // حفظ بيانات الطلب والخصم
      // ==============================

      // ==============================
// حفظ بيانات الطلب ورقم الطلب
// ==============================

const [orderResult] = await connection.query(
  `INSERT INTO orders
  (
      customer_id,
      daily_order_number,
      total_price,
      subtotal,
      discount_amount,
      coupon_code,
      status,
      order_type,
      delivery_phone,
      delivery_address
  )
  VALUES (?, ?, ?, ?, ?, ?, 'قيد الانتظار', 'الموقع', ?, ?)`,
  [
    customerId,
    dailyOrderNumber,
    totalPrice,
    subtotal,
    discountAmount,
    appliedCouponCode,
    phone,
    address,
  ],
);

const orderId = orderResult.insertId;

      // ==============================
      // تسجيل استخدام الكوبون
      // ==============================

      if (appliedCouponCode) {
        const [couponRows] = await connection.query(
          `SELECT id
         FROM coupons
         WHERE code = ?
         LIMIT 1`,
          [appliedCouponCode],
        );

        if (appliedCouponId) {
          await connection.query(
            `INSERT INTO coupon_usages
            (coupon_id, customer_id, order_id)
         VALUES (?, ?, ?)`,
            [appliedCouponId, customerId, orderId],
          );
        }
      }

      for (const item of normalizedItems) {
        await connection.query(
          `INSERT INTO order_items
                        (order_id, product_id, quantity, price)
                     VALUES (?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, item.price],
        );
      }

      await connection.commit();

      return {
        orderId,
        dailyOrderNumber,
        subtotal,
        discountAmount,
        couponCode: appliedCouponCode,
        totalPrice,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = CheckoutService;
