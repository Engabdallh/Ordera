const express = require('express');
const expressSession = require('express-session');
require('dotenv').config();
require('./Database/db');

const app = express();
const PORT = Number(process.env.PORT) || 9000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    app.set('trust proxy', 1);
}

app.set('view engine', 'ejs');
app.set('views', './Views');

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is missing from .env');
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public'));

app.use(expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use((req, res, next) => {
    console.log("================================");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("SESSION:", req.session);
    console.log("USER ID:", req.session?.userId);
    console.log("USER NAME:", req.session?.userName);
    console.log("ROLE:", req.session?.role);
    console.log("================================");

    next();
});

const adminRoutes = require('./Routes/adminRoutes');
const authRoutes = require('./Routes/authRoutes');
const customerRoutes = require('./Routes/customerRoutes');
const cartRoutes = require('./Routes/cartRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const callCenterRoutes = require('./Routes/callCenterRoutes');
const couponRoutes = require("./Routes/couponRoutes");

app.use((req, res, next) => {
    console.log(`Method: ${req.method} | URL: ${req.url}`);
    next();
});

app.get('/', (req, res) => res.redirect('/login'));

app.use('/admin', adminRoutes);
app.use('/', authRoutes);
app.use('/', customerRoutes);
app.use('/', orderRoutes);
app.use('/cart', cartRoutes);
app.use('/call-center', callCenterRoutes);
app.use("/admin/coupons", couponRoutes);



// Multer / request errors should not expose stack traces to users.
app.use((err, req, res, next) => {
    console.error('UNHANDLED ERROR:', err);

    if (err.name === 'MulterError' || err.message?.includes('يسمح فقط بصور')) {
        return res.status(400).send(err.message || 'ملف الرفع غير صالح');
    }

    res.status(500).send('حدث خطأ في الخادم');
});

app.listen(PORT, () => {
    console.log(`Ordera server is running on http://localhost:${PORT}`);
});