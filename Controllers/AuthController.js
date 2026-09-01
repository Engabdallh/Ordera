const AuthService = require("../Services/AuthService");

const authService = new AuthService();

const showLoginPage = (req, res) => {

    res.render("login", {
        message: null,
        error: null
    });

};


const login = async (req, res) => {

    try {

        const {
            name,
            password
        } = req.body;

        console.log("LOGIN STARTED");
        console.log("Name:", name);

        const result =
            await authService.login(
                name,
                password
            );

        // الحساب غير موجود
        if (!result) {

            return res.render("login", {
                message: null,
                error: "اسم المستخدم أو كلمة السر غير صحيحة"
            });

        }


        // ==============================
        // Admin
        // ==============================

        if (result.role === "admin") {

            req.session.userId = result.user.id;
            req.session.userName = result.user.name;
            req.session.role = "admin";

            console.log("user Name :", req.session.userName);
            console.log("ID:", req.session.userId);
            console.log("Role:", req.session.role);

            return res.redirect("/admin");
        }


        // ==============================
        // Call Center
        // ==============================

        if (result.role === "call_center") {

            req.session.userId = result.user.id;
            req.session.userName = result.user.name;
            req.session.role = "call_center";

            console.log("user name :", req.session.userName);
            console.log("ID:", req.session.userId);
            console.log("Role:", req.session.role);

            return res.redirect("/call-center");
        }


        // ==============================
        // Customer
        // ==============================

        if (result.role === "customer") {

            req.session.userId = result.user.id;
            req.session.userName = result.user.name;
            req.session.role = "customer";

            console.log("user name :", req.session.userName);
            console.log("ID:", req.session.userId);
            console.log("Role:", req.session.role);

            return res.redirect("/products");
        }


        return res.render("login", {
            message: null,
            error: "نوع الحساب غير معروف"
        });


    } catch (error) {

        console.error("LOGIN ERROR:", error);

        res.status(500).send(
            "حدث خطأ أثناء تسجيل الدخول"
        );

    }

};

const register = async (req, res) => {

    try {

        console.log("1 - registration started");
        console.log("BODY:", req.body);

        const {
            name,
            phone,
            address,
            email,
            password
        } = req.body;


        console.log("2 - checking email");

        const existingCustomer =
            await authService.findCustomerByEmail(email);

        console.log("3 - email checked:", existingCustomer);


        if (existingCustomer) {

            return res.render("register", {
                error: "البريد الإلكتروني مستخدم مسبقًا"
            });

        }


        console.log("4 - creating customer");

        await authService.createCustomer(
            name,
            phone,
            address,
            email,
            password
        );

        console.log("5 - customer created");


        res.render("login", {
            message: "تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول",
            error: null
        });


    } catch (error) {

        console.error("REGISTER ERROR:", error);

        res.status(500).send(
            "حدث خطأ أثناء إنشاء الحساب"
        );

    }

};


// ==============================
// تسجيل الخروج
// ==============================

const logout = (req, res) => {

    res.redirect("/login");

};

const showRegisterPage = (req, res) => {

    res.render("register", {
        error: null
    });

};


// ==============================
// Export
// ==============================

module.exports = {

    showLoginPage,
    login,
    register,
    logout,
    showRegisterPage

};