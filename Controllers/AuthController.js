const AuthService = require("../Services/AuthService");

const authService = new AuthService();

const showLoginPage = (req, res) => {
  res.render("login", { message: null, error: null });
};

const login = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "");

    if (!name || !password) {
      return res.status(400).render("login", {
        message: null,
        error: "اسم المستخدم وكلمة السر مطلوبان",
      });
    }

    const result = await authService.login(name, password);

    if (!result) {
      return res.status(401).render("login", {
        message: null,
        error: "اسم المستخدم أو كلمة السر غير صحيحة",
      });
    }

    // Prevent session fixation: issue a fresh session after login.
    req.session.regenerate((err) => {
      if (err) {
        console.error("SESSION REGENERATE ERROR:", err);
        return res.status(500).send("حدث خطأ أثناء تسجيل الدخول");
      }

      req.session.userId = result.user.id;
      req.session.userName = result.user.name;
      req.session.role = result.role;

      if (result.role === "admin") return res.redirect("/admin");
      if (result.role === "call_center") return res.redirect("/call-center");
      if (result.role === "customer") return res.redirect("/products");

      return res.status(403).send("نوع الحساب غير معروف");
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).send("حدث خطأ أثناء تسجيل الدخول");
  }
};

const register = async (req, res) => {
  try {
    const name = String(
      req.body.name || "",
    ).trim();

    const phone = String(
      req.body.phone || "",
    ).trim();

    const address = String(
      req.body.address || "",
    ).trim();

    const email = String(
      req.body.email || "",
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body.password || "",
    );

    const confirmPassword = String(
      req.body.confirmPassword || "",
    );

    // =========================================
    // REQUIRED FIELDS
    // =========================================

    if (
      !name ||
      !phone ||
      !address ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).render(
        "register",
        {
          error: "جميع الحقول مطلوبة",
        },
      );
    }

    // =========================================
    // PASSWORD LENGTH
    // =========================================

    if (password.length < 8) {
      return res.status(400).render(
        "register",
        {
          error:
            "كلمة السر يجب أن تكون 8 أحرف على الأقل",
        },
      );
    }

    // =========================================
    // PASSWORD CONFIRMATION
    // =========================================

    if (
      password !==
      confirmPassword
    ) {
      return res.status(400).render(
        "register",
        {
          error:
            "كلمتا السر غير متطابقتين",
        },
      );
    }

    // =========================================
    // EMAIL VALIDATION
    // =========================================

    if (
      !/^\S+@\S+\.\S+$/.test(
        email,
      )
    ) {
      return res.status(400).render(
        "register",
        {
          error:
            "البريد الإلكتروني غير صحيح",
        },
      );
    }

    // =========================================
    // CHECK EXISTING EMAIL
    // =========================================

    const existingCustomer =
      await authService.findCustomerByEmail(
        email,
      );

    if (existingCustomer) {
      return res.status(409).render(
        "register",
        {
          error:
            "البريد الإلكتروني مستخدم مسبقًا",
        },
      );
    }

    // =========================================
    // CREATE CUSTOMER
    // =========================================

    await authService.createCustomer(
      name,
      phone,
      address,
      email,
      password,
    );

    // =========================================
    // SUCCESS
    // =========================================

    return res.render(
      "login",
      {
        message:
          "تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول",
        error: null,
      },
    );

  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error,
    );

    // MySQL duplicate-key protection
    if (
      error.code ===
      "ER_DUP_ENTRY"
    ) {
      return res.status(409).render(
        "register",
        {
          error:
            "البريد الإلكتروني مستخدم مسبقًا",
        },
      );
    }

    return res
      .status(500)
      .send(
        "حدث خطأ أثناء إنشاء الحساب",
      );
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("LOGOUT ERROR:", err);
      return res
        .status(500)
        .send("حدث خطأ أثناء تسجيل الخروج");
    }

    res.clearCookie("connect.sid");

    res.redirect("/");
  });
};

const showRegisterPage = (req, res) => {
  res.render("register", { error: null });
};

module.exports = {
  showLoginPage,
  login,
  register,
  logout,
  showRegisterPage,
};
