const ProductService = require("../Services/ProductService");

const productService = new ProductService();


const showProductsPage = async (req, res) => {

    try {

        const products = await productService.getAllProducts();

        res.render("admin/products", {
            products: products
        });

    } catch (error) {

        console.error(error);

        res.status(500).send("حدث خطأ في الخادم");
    }
};


const createProduct = async (req, res) => {

    try {

        const {
            name,
            description,
            price,
            category
        } = req.body;


        // مسار الصورة
        let image = null;

        if (req.file) {
            image = `/uploads/products/${req.file.filename}`;
        }


        await productService.createProduct(
            name,
            description,
            price,
            category,
            image
        );


        res.redirect("/admin/products");


    } catch (error) {

        console.error(error);

        res.status(500).send(
            "حدث خطأ أثناء إضافة المنتج"
        );

    }

};


const showEditProductPage = async (req, res) => {

    try {

        const product = await productService.getProductById(req.params.id);

        if (!product) {
            return res.status(404).send("المنتج غير موجود");
        }

        res.render("admin/edit-product", {
            product: product
        });

    } catch (error) {

        console.error(error);

        res.status(500).send("حدث خطأ في الخادم");
    }
};


const updateProduct = async (req, res) => {

    try {

        const {
            name,
            description,
            price,
            category
        } = req.body;


        // الحصول على المنتج الحالي
        const currentProduct =
            await productService.getProductById(req.params.id);


        if (!currentProduct) {

            return res.status(404).send(
                "المنتج غير موجود"
            );

        }


        // الصورة القديمة
        let image = currentProduct.image;


        // إذا تم اختيار صورة جديدة
        if (req.file) {

            image =
                `/uploads/products/${req.file.filename}`;

        }


        await productService.updateProduct(
            req.params.id,
            name,
            description,
            price,
            category,
            image
        );


        res.redirect("/admin/products");


    } catch (error) {

        console.error(error);

        res.status(500).send(
            "حدث خطأ أثناء تعديل المنتج"
        );

    }

};


const deleteProduct = async (req, res) => {

    try {

        await productService.deleteProduct(req.params.id);

        res.redirect("/admin/products");

    } catch (error) {

        console.error(error);

        res.status(500).send("حدث خطأ أثناء حذف المنتج");
    }
};


module.exports = {
    showProductsPage,
    createProduct,
    showEditProductPage,
    updateProduct,
    deleteProduct
};