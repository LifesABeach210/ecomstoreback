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
const createOrder = async (email, isComplete, total, money) => {
  const collection = await blogsDB().collection("orderHistory");

  const order = {
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
    };
    console.log(jwtSecretKey);
    const token = jwt.sign(data, jwtSecretKey);
    if (!checkPassword) throw { error: "credential do not match" };
    res.status(200).json({ Login: true, user: foundUser,token:token });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error" + e });
  }
});

module.exports = router;
