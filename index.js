// 建立資料庫連線
const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://root:root123@mycluster.flhjk.mongodb.net/?retryWrites=true&w=majority&appName=MyCluster";
let db = null;

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    db = client.db("menber-system");
    console.log("資料庫連線成功");
  } catch (err) {
    console.log("連線失敗", err);
  }
}

// 建立網站伺服器基礎設定
const express = require("express");
const app = express();
const session = require("express-session");
app.use(
  session({
    secret: "anything",
    resave: false,
    saveUninitialized: true,
  })
);
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// 處理路由
app.get("/", function (req, res) {
  res.render("index.ejs");
});
app.get("/member", function (req, res) {
  res.render("member.ejs");
});
// 連線到 /error?msg=錯誤訊息
app.get("/error", function (req, res) {
  const msg = req.query.msg;
  res.render("error.ejs", { msg: msg });
});
// 登出會員
app.get("/signout", function (req, res) {
  req.session.member = null;
  res.redirect("/");
});

// 登入會員
app.post("/signin", async function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  // 檢查資料庫中的資料
  const collection = db.collection("member");
  let result = await collection.findOne({
    $and: [{ email: email }, { password: password }],
  });
  if (result === null) {
    //沒有對應的會員資料，登入失敗
    res.redirect("/error?msg=登入失敗，郵件或密碼輸入錯誤");
    return;
  }
  // 登入成功，紀錄會員資訊在 Session 中
  req.session.member = result;
  res.redirect("/member");
});
// 註冊會員
app.post("/signup", async function (req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  // 檢查資料庫的資料
  const collection = db.collection("member");
  let result = await collection.findOne({
    email: email,
  });
  if (result !== null) {
    res.redirect("/error?msg=註冊失敗，信箱重複");
    return;
  }
  // 將新的資料放到資料庫
  result = await collection.insertOne({
    name: name,
    email: email,
    password: password,
  });
  // 新增成功，導回首頁
  res.redirect("/");
});

// 啟動伺服器
main().then(() => {
  app.listen(3000, function () {
    console.log("Sever Started");
  });
});
