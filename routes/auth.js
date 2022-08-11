var express = require("express");
var router = express.Router();
const bcrypt = require("bcryptjs");
const { uuid } = require("uuidv4");
const { blogsDB } = require("../mongo");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();

router.get("/", function (req, res, next) {
  res.render("auth", { title: "Express" });
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

const createUser = async (email, hashPassword, type) => {
  const collection = await blogsDB().collection("users");

  const user = {
    email: email,
    password: hashPassword,
    uid: uuid(),
    type: type,
  };
  try {
    await collection.insertOne(user);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

const uploadProduct = async (img_url, price, type, catergory, title) => {
  const collection = await blogsDB().collection("products");

  const product = {
    id: uuid(),
    title: title,
    catergory: catergory,
    img_url: String,
    email: String,
    isComplete: Boolean,
    createdAt: new Date().toDateString,
    submittedAt: new Date().toDateString,
    price: price,
    type: String,
  };
  try {
    collection.insertOne(product);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
router.post("/upload-products", async (req, res) => {
  const { img_url, price, type, catergory, title } = req.body;
  const collection2 = await blogsDB().collection("users");
  try {
    if (collection2.type === "admin") {
      const uploadOrder = await uploadProduct(
        title,
        img_url,
        price,
        type,
        catergory
      );
    }
  } catch (error) {}
});

const createOrder = async (email, isComplete, total, money) => {
  const collection = await blogsDB().collection("orderHistory");

  const order = {
    img_url: String,
    orderId: uuid(),
    email: email,
    isComplete: Boolean,
    createdAt: new Date().toDateString,
    submittedAt: new Date().toDateString,
    total: "$" + money,
  };
  try {
    collection.insertOne(order);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

router.post("/current-order", async function (req, res, next) {
  const { email, isComplete, total, money } = req.body;
  const collection2 = await blogsDB().collection("users");

  try {
    const verify = await collection2.findOne({ email: email });
    if (verify === null) throw new Error("stop hacking");

    const postOrder = await createOrder(email, isComplete, total, money);
    res.status(200).json({ success: postOrder });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error" + e });
  }
});

router.post("/create-user", async function (req, res, next) {
  try {
    const email = req.body.email;
    const type = req.body.type;
    const password = req.body.password;
    const saltRounds = 5;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    const userCreatedSucess = await createUser(email, hash, type);
    console.log(userCreatedSucess);
    res.status(200).json({ success: userCreatedSucess });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error" + e });
  }
});

router.post("/login", async (req, res) => {
  const { email, password, type } = req.body;
  const collection = await blogsDB().collection("users");

  try {
    const foundUser = await collection.findOne({ email: email });

    if (foundUser === null) throw { error: "no user found" };
    const checkPassword = await bcrypt.compare(password, foundUser.password);
    console.log(foundUser.uid);
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const data = {
      time: new Date(),
      userID: foundUser.uid,
      user: foundUser.email,
      type: foundUser.type,
    };
    console.log(jwtSecretKey);
    const token = jwt.sign(data, jwtSecretKey);
    if (!checkPassword) throw { error: "credential do not match" };
    res.status(200).json({ Login: true, user: foundUser, token: token });
  } catch (e) {
    res.status(500).json({ Login: false, message: "Error" + e });
  }
});

router.get("/validate-token", async (req, res) => {
  const tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
  const jwtSecretKey = process.env.JWT_SECRET_KEY;
  try {
    const token = req.header(tokenHeaderKey);
    const verify = jwt.verify(token, jwtSecretKey);
    console.log(verify);
    if (verify) {
      return res.json({ success: true });
    }
  } catch (e) {
    return res.status(401).json({ success: false, message: "no token" });
  }
});



module.exports = router;
