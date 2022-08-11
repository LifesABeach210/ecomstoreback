var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const { uuid } = require("uuidv4");
const { blogsDB } = require("../mongo");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();
router.get("/", function (req, res, next) {
  res.render("main", { title: "Express" });
});

router.get("/get-products", async (req, res, next) => {
  const collection = await blogsDB().collection("products");

  if (collection) {
    try {
      const products = await collection
        .find({})
        .sort({ id: -1 })
        .project({
          id: 1,
          title: 1,
          description: 1,
          category: 1,
          image: 1,
          rating: 1,
        })
        .toArray();

      if (products) {
        return res.status(200).json({ success: true, message: products });
      }
    } catch (e) {
      return res
        .status(401)
        .json({ success: false, message: "uploading faild" });
    }}

    try {
      const collection = await blogsDB().collection("products");
      const limit = Number(req.query.limit);
      const skip = Number(req.query.limit) * (Number(req.query.page) - 1);
      const sortField = req.query.sortField;

      const sortOrder = req.query.sortOrder === "ASC" ? 1 : -1;
      const filterField = req.query.filterField;
      const filterValue = req.query.filterValue;

      let filterObj = {};
      if (filterField && filterValue) {
        filterObj = { [filterField]: filterValue };
      }
      let sortObj = {};
      if (sortField && sortOrder) {
        sortObj = { [sortField]: sortOrder };
      }

      const products = await collection
        .find(filterObj)
        .sort(sortObj)
        .limit(limit)
        .skip(skip)
        .toArray();
      res.json({ message: products });
    } catch (error) {
      res.status(500).send("error fetching posts " + error);
    }
  
});

//   try {
//     const collection = await blogsDB().collection("products");
//     const products = await collection
//       .find({})
//       .sort({ id: -1 })
//       .project({
//         id: 1,
//         title: 1,
//         description: 1,
//         category: 1,
//         image: 1,
//         rating: 1,
//       })
//       .toArray();

//     if (products) {
//       return res.status(200).json({ success: true, message: products });
//     }
//   } catch (e) {
//     return res.status(401).json({ success: false, message: "uploading faild" });
//   }
// });

router.get("/main", async (req, res, next) => {
  try {
    const collection = await blogsDB().collection("products");
    const limit = Number(req.query.limit);
    const skip = Number(req.query.limit) * (Number(req.query.page) - 1);
    const sortField = req.query.sortField;
    // if sort field is equal to "ASC", then sequential (1), if not, sequential in reverse order (-1).
    const sortOrder = req.query.sortOrder === "ASC" ? 1 : -1;
    const filterField = req.query.filterField;
    const filterValue = req.query.filterValue;

    let filterObj = {};
    if (filterField && filterValue) {
      filterObj = { [filterField]: filterValue };
    }
    let sortObj = {};
    if (sortField && sortOrder) {
      sortObj = { [sortField]: sortOrder };
    }

    const products = await collection
      .find(filterObj)
      .sort(sortObj)
      .limit(limit)
      .skip(skip)
      .toArray();
    res.json({ message: products });
  } catch (error) {
    res.status(500).send("error fetching posts " + error);
  }
});

module.exports = router;
