const ProductService = require("../Services/ProductService");
const fs = require("fs");
const path = require("path");

const productService = new ProductService();

// عرض صفحة المنتجات
// عرض صفحة المنتجات
const showProductsPage = async (req, res) => {
  try {
    const products = await productService.getAllProducts();

    const success = req.query.success;

    res.render("admin/products", {
      products: products,
      success,
    });
  } catch (error) {
    console.error(error);

    res.status(500).send("حدث خطأ في الخادم");
  }
};

// إضافة منتج
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    let image = null;

    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    }

    await productService.createProduct(
      name,
      description,
      price,
      category,
      image,
    );

    res.redirect("/admin/products/add?success=product-added");
  } catch (error) {
    console.error(error);

    res.status(500).send("حدث خطأ أثناء إضافة المنتج");
  }
};

// عرض صفحة تعديل المنتج
const showEditProductPage = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).send("المنتج غير موجود");
    }

    const success = req.query.success;

    res.render("admin/edit-product", {
      product: product,
      success,
    });
  } catch (error) {
    console.error(error);

    res.status(500).send("حدث خطأ في الخادم");
  }
};

// تعديل المنتج
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;

    // الحصول على المنتج الحالي
    const currentProduct = await productService.getProductById(req.params.id);

    if (!currentProduct) {
      // إذا تم رفع صورة جديدة ولكن المنتج غير موجود
      // نحذف الصورة الجديدة حتى لا تبقى بدون استخدام
      if (req.file) {
        const newImagePath = path.join(
          __dirname,
          "..",
          "public",
          "uploads",
          "products",
          req.file.filename,
        );

        if (fs.existsSync(newImagePath)) {
          fs.unlinkSync(newImagePath);
        }
      }

      return res.status(404).send("المنتج غير موجود");
    }

    // الصورة الحالية
    let image = currentProduct.image;

    // إذا تم اختيار صورة جديدة
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;

      // حذف الصورة القديمة
      if (currentProduct.image) {
        const oldImageName = path.basename(currentProduct.image);

        const oldImagePath = path.join(
          __dirname,
          "..",
          "public",
          "uploads",
          "products",
          oldImageName,
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);

          console.log("تم حذف الصورة القديمة:", oldImageName);
        }
      }
    }

    await productService.updateProduct(
      req.params.id,
      name,
      description,
      price,
      category,
      image,
    );

    res.redirect(`/admin/products/edit/${req.params.id}?success=product-updated`);
  } catch (error) {
    console.error(error);

    res.status(500).send("حدث خطأ أثناء تعديل المنتج");
  }
};

// حذف المنتج
const deleteProduct = async (req, res) => {
  try {
    // الحصول على المنتج قبل حذفه
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).send("المنتج غير موجود");
    }

    // حذف صورة المنتج من المجلد
    if (product.image) {
      const imageName = path.basename(product.image);

      const imagePath = path.join(
        __dirname,
        "..",
        "public",
        "uploads",
        "products",
        imageName,
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);

        console.log("تم حذف صورة المنتج:", imageName);
      }
    }

    // حذف المنتج من قاعدة البيانات
    await productService.deleteProduct(req.params.id);

    res.redirect("/admin/products?success=product-deleted");
  } catch (error) {
    console.error(error);

    res.status(500).send("حدث خطأ أثناء حذف المنتج");
  }
};
// تغيير حالة توفر المنتج
const toggleProductAvailability = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).send("المنتج غير موجود");
    }

    await productService.toggleProductAvailability(req.params.id);

    if (product.is_available) {
      return res.redirect("/admin/products?success=product-disabled");
    }

    return res.redirect("/admin/products?success=product-enabled");
  } catch (error) {
    console.error(error);

    res.status(500).send("حدث خطأ أثناء تغيير حالة المنتج");
  }
};

module.exports = {
  showProductsPage,
  createProduct,
  showEditProductPage,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
};
