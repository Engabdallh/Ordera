const express = require("express");
const expressSession = require("express-session");

require("./Database/db");

const app = express();
const PORT = 9000;

app.set("view engine", "ejs");
app.set("views", "./Views");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(expressSession({
    secret: "ordera-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const adminRoutes = require("./Routes/adminRoutes");
const authRoutes = require("./Routes/authRoutes");
const customerRoutes = require("./Routes/customerRoutes");
const cartRoutes = require("./Routes/cartRoutes");
const orderRoutes =require("./Routes/orderRoutes");
const callCenterRoutes = require("./Routes/callCenterRoutes");

// تسجيل كل الطلبات
app.use((req, res, next) => {
    console.log(`Method: ${req.method} | URL: ${req.url}`);
    next();
});

app.use("/admin", adminRoutes);
app.use("/", authRoutes);
app.use("/", customerRoutes);
app.use("/", orderRoutes);
app.use("/cart", cartRoutes);
app.use("/call-center", callCenterRoutes);

app.listen(PORT, () => {
    console.log(`Ordera server is running on http://localhost:${PORT}`);
});