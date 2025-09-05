const brandModel = require("../../models/brandModel");
exports.addBrands = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "brand name missing" });
    }
    const insertBrand = await brandModel.create({ brand: name });
    if (!insertBrand) {
      return res.status(400).json({
        success: false,
        message: "Failed to add brand",
      });
    }
    return res
      .status(201)
      .json({ success: true, message: "Brand add successfull" });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: error.message, error });
  }
};

//  get all brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await brandModel.find({});
    if (!brands || brands.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "no brands found.. try agian" });
    }
    return res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: error.message, error });
  }
};
