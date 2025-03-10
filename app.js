const express = require("express");
const multer = require("multer");
const path = require("path");
<<<<<<< HEAD
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

=======
const fs = require("fs");
const createError = require("http-errors");
>>>>>>> 18e9b90234b8035fc3bbeee7f4b4fa12af29c519
const indexRouter = require("./routes/index");

const app = express();

<<<<<<< HEAD
// 📌 **EJS 템플릿 엔진 설정**
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

console.log("✅ View Engine Set: EJS");

// ✅ 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, "public")));

// 🚀 **라우터 실행**
=======
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ✅ 업로드 경로를 정확히 /tmp로 수정!
const uploadDir = "/tmp";
app.use("/tmp", express.static(uploadDir));
app.use(express.static(path.join(__dirname, "public")));

>>>>>>> 18e9b90234b8035fc3bbeee7f4b4fa12af29c519
app.use("/", indexRouter);
app.use("/users", usersRouter);

<<<<<<< HEAD
// 📌 **미들웨어 설정**
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ❌ **404 에러 처리**
=======
>>>>>>> 18e9b90234b8035fc3bbeee7f4b4fa12af29c519
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;
