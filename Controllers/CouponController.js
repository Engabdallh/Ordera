const CouponService = require("../Services/CouponService");

const couponService = new CouponService();

// ==============================
// عرض جميع الكوبونات
// ==============================

const showCoupons = async (req, res) => {
    try {

        const coupons = await couponService.getAllCoupons();

        res.render("admin/coupons", {
            coupons,
            error: req.query.error || null,
            success: req.query.success || null
        });

    } catch (error) {

        console.error("SHOW COUPONS ERROR:", error);

        res.status(500).send("حدث خطأ أثناء عرض الكوبونات");
    }
};


// ==============================
// إضافة كوبون
// ==============================

const createCoupon = async (req, res) => {
    try {

        const {
             code,
             discountType,
             discountValue,
             minOrderAmount,
             usageLimit,
             usageLimitPerCustomer,
             expiresAt
         } = req.body;

        await couponService.createCoupon({
          code,
          discountType,
          discountValue,
          minOrderAmount,
          usageLimit,
          usageLimitPerCustomer,
          expiresAt
    });

        return res.redirect(
            "/admin/coupons?success=" +
            encodeURIComponent("تم إضافة الكوبون بنجاح")
        );

    } catch (error) {

        console.error("CREATE COUPON ERROR:", error);

        let message = "حدث خطأ أثناء إضافة الكوبون";

        if (error.code === "ER_DUP_ENTRY") {
            message = "كود الكوبون موجود مسبقًا";
        } else if (error.message) {
            message = error.message;
        }

        return res.redirect(
            "/admin/coupons?error=" +
            encodeURIComponent(message)
        );
    }
};


// ==============================
// تفعيل / تعطيل كوبون
// ==============================

const toggleCoupon = async (req, res) => {
    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).send("رقم الكوبون غير صحيح");
        }

        await couponService.toggleCoupon(id);

        return res.redirect("/admin/coupons");

    } catch (error) {

        console.error("TOGGLE COUPON ERROR:", error);

        return res.status(500).send(
            "حدث خطأ أثناء تغيير حالة الكوبون"
        );
    }
};

const deleteCoupon = async (req, res) => {
    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).send("رقم الكوبون غير صحيح");
        }

        await couponService.deleteCoupon(id);

        return res.redirect(
            "/admin/coupons?success=" +
            encodeURIComponent("تم حذف الكوبون بنجاح")
        );

    } catch (error) {

        console.error("DELETE COUPON ERROR:", error);

        return res.status(500).send(
            "حدث خطأ أثناء حذف الكوبون"
        );
    }
};

module.exports = {
    showCoupons,
    createCoupon,
    toggleCoupon,
    deleteCoupon
};