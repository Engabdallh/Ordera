const OrderService = require("../Services/OrderService");

const orderService = new OrderService();


// =====================================================
// عرض سجل طلبات الزبون
// =====================================================

const showCustomerOrders = async (req, res) => {

    try {

        // التأكد أن المستخدم مسجل دخول كـ Customer

        if (
            !req.session.userId ||
            req.session.role !== "customer"
        ) {
            return res.redirect("/login");
        }


        const customerId = req.session.userId;

        const userName = req.session.userName;


        // جلب طلبات الزبون

        const orders =
            await orderService.getCustomerOrders(
                customerId
            );


        // جلب منتجات كل طلب

        for (const order of orders) {

            order.items =
                await orderService.getOrderItems(
                    order.id
                );

        }


        console.log(
            "CUSTOMER ORDERS:",
            orders
        );


        res.render(
            "customer/orders",
            {
                orders: orders,
                userName: userName
            }
        );


    } catch (error) {

        console.error(
            "SHOW CUSTOMER ORDERS ERROR:",
            error
        );

        res.status(500).send(
            "حدث خطأ أثناء عرض سجل الطلبات"
        );

    }

};



module.exports = {
    showCustomerOrders
};