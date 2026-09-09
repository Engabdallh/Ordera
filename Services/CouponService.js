const db = require("../Database/db");

class CouponService {
  // =====================================================
  // التحقق من الكوبون وحساب الخصم
  // =====================================================

  async validateCoupon(code, subtotal, customerId) {
    // =================================================
    // التحقق من إدخال الكود
    // =================================================

    if (!code) {
      return {
        valid: false,
        message: "أدخل كود الخصم",
      };
    }

    const cleanCode = String(code).trim().toUpperCase();

    // =================================================
    // التحقق من قيمة الطلب
    // =================================================

    const amount = Number(subtotal);

    if (!Number.isFinite(amount) || amount < 0) {
      return {
        valid: false,
        message: "قيمة الطلب غير صحيحة",
      };
    }

    // =================================================
    // البحث عن الكوبون
    // =================================================

    const [rows] = await db.query(
      `SELECT *
         FROM coupons
         WHERE code = ?
         AND is_active = 1
         LIMIT 1`,
      [cleanCode],
    );

    if (rows.length === 0) {
      return {
        valid: false,
        message: "كود الخصم غير صحيح أو غير فعال",
      };
    }

    const coupon = rows[0];

    // =================================================
    // التحقق من الحد الإجمالي لاستخدام الكوبون
    // =================================================

    if (coupon.usage_limit !== null) {
      const [totalUsageRows] = await db.query(
        `SELECT COUNT(*) AS usageCount
             FROM coupon_usages
             WHERE coupon_id = ?`,
        [coupon.id],
      );

      if (Number(totalUsageRows[0].usageCount) >= Number(coupon.usage_limit)) {
        return {
          valid: false,
          message: "تم الوصول إلى الحد الأقصى لاستخدام هذا الكوبون",
        };
      }
    }

    // =================================================
    // التحقق من حد الاستخدام لكل عميل
    // =================================================

    if (customerId && coupon.usage_limit_per_customer !== null) {
      const [customerUsageRows] = await db.query(
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
        return {
          valid: false,
          message: "لقد وصلت إلى الحد الأقصى لاستخدام هذا الكوبون",
        };
      }
    }

    // =================================================
    // التحقق من تاريخ انتهاء الكوبون
    // =================================================

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return {
        valid: false,
        message: "انتهت صلاحية كود الخصم",
      };
    }

    // =================================================
    // التحقق من الحد الأدنى للطلب
    // =================================================

    const minimumOrder = Number(coupon.min_order_amount);

    if (amount < minimumOrder) {
      return {
        valid: false,
        message: `الحد الأدنى لاستخدام هذا الكوبون هو ${minimumOrder.toFixed(2)} د.أ`,
      };
    }

    // =================================================
    // حساب الخصم
    // =================================================

    let discountAmount = 0;

    if (coupon.discount_type === "percentage") {
      discountAmount = amount * (Number(coupon.discount_value) / 100);
    } else if (coupon.discount_type === "fixed") {
      discountAmount = Number(coupon.discount_value);
    }

    // =================================================
    // منع الخصم من تجاوز قيمة الطلب
    // =================================================

    discountAmount = Math.min(discountAmount, amount);

    discountAmount = Number(discountAmount.toFixed(2));

    // =================================================
    // حساب السعر النهائي
    // =================================================

    const totalPrice = Number((amount - discountAmount).toFixed(2));

    // =================================================
    // النتيجة
    // =================================================

    return {
      valid: true,

      couponId: coupon.id,

      couponCode: coupon.code,

      discountType: coupon.discount_type,

      discountValue: Number(coupon.discount_value),

      discountAmount,

      subtotal: Number(amount.toFixed(2)),

      totalPrice,
    };
  }

  // ==============================
  // جلب جميع الكوبونات
  // ==============================

  async getAllCoupons() {
    const [rows] = await db.query(
      `SELECT
            c.*,
            COUNT(cu.id) AS usage_count
         FROM coupons c
         LEFT JOIN coupon_usages cu
            ON c.id = cu.coupon_id
         GROUP BY c.id
         ORDER BY c.id DESC`,
    );

    return rows;
  }
  // ==============================
  // إضافة كوبون جديد
  // ==============================

  async createCoupon({
    code,
    discountType,
    discountValue,
    minOrderAmount,
    usageLimit,
    usageLimitPerCustomer,
    expiresAt,
  }) {
    const cleanCode = String(code).trim().toUpperCase();

    const value = Number(discountValue);
    const minimum = Number(minOrderAmount || 0);

    const totalUsageLimit =
      usageLimit === "" || usageLimit == null ? null : Number(usageLimit);

    const customerUsageLimit =
      usageLimitPerCustomer === "" || usageLimitPerCustomer == null
        ? null
        : Number(usageLimitPerCustomer);

    if (
      totalUsageLimit !== null &&
      (!Number.isInteger(totalUsageLimit) || totalUsageLimit <= 0)
    ) {
      throw new Error("الحد الإجمالي للاستخدام غير صحيح");
    }

    if (
      customerUsageLimit !== null &&
      (!Number.isInteger(customerUsageLimit) || customerUsageLimit <= 0)
    ) {
      throw new Error("حد الاستخدام لكل عميل غير صحيح");
    }

    if (!cleanCode) {
      throw new Error("كود الكوبون مطلوب");
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      throw new Error("نوع الخصم غير صحيح");
    }

    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("قيمة الخصم غير صحيحة");
    }

    if (discountType === "percentage" && value > 100) {
      throw new Error("نسبة الخصم لا يمكن أن تتجاوز 100%");
    }

    if (!Number.isFinite(minimum) || minimum < 0) {
      throw new Error("الحد الأدنى للطلب غير صحيح");
    }

    await db.query(
      `INSERT INTO coupons
        (
            code,
            discount_type,
            discount_value,
            min_order_amount,
            expires_at,
            usage_limit,
            usage_limit_per_customer,
            is_active
        )
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        cleanCode,
        discountType,
        value,
        minimum,
        expiresAt || null,
        totalUsageLimit,
        customerUsageLimit,
      ],
    );
  }

  // ==============================
  // تفعيل / تعطيل كوبون
  // ==============================

  async toggleCoupon(id) {
    const [result] = await db.query(
      `UPDATE coupons
         SET is_active = IF(is_active = 1, 0, 1)
         WHERE id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      throw new Error("الكوبون غير موجود");
    }
  }

  // ==============================
  // حذف كوبون
  // ==============================

  async deleteCoupon(id) {
    const [result] = await db.query(
      `DELETE FROM coupons
         WHERE id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      throw new Error("الكوبون غير موجود");
    }
  }
}

module.exports = CouponService;
