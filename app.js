const express = require("express");
const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();

// 📌 **EJS 템플릿 엔진 설정**
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

console.log("✅ View Engine Set: EJS");

// ✅ 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, "public")));

// 🚀 **라우터 실행**
app.use("/", indexRouter);
app.use("/users", usersRouter);

// 📌 **미들웨어 설정**
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ❌ **404 에러 처리**
app.use(function (req, res, next) {
  next(createError(404));
});

// ⚠️ **에러 핸들러**
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

// 🚀 **서버 실행**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;
