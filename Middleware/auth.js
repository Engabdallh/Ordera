// Authentication and authorization middleware

const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect("/login");
  }
  next();
};

const requireRole = (role) => (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== role) {
    return res.status(403).send("غير مصرح لك بالوصول إلى هذه الصفحة");
  }

  next();
};

// =====================================================
// السماح للزبون المسجل أو الزائر
// =====================================================

const requireCustomerOrGuest = (req, res, next) => {
  // زبون مسجل
  if (req.session?.userId && req.session?.role === "customer") {
    return next();
  }

  // زائر
  if (req.session?.isGuest === true) {
    return next();
  }

  return res.redirect("/");
};

module.exports = {
  requireAuth,
  requireRole,
  requireCustomerOrGuest,
};
