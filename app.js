const express = require("express");
const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const fs = require("fs");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();

// 📌 **EJS 템플릿 엔진 설정 (오류 해결)**
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs"); // ← 🚀 **EJS 엔진 설정 추가**

console.log("✅ View Engine Set: EJS");

// 📂 **업로드 폴더 자동 생성 (없으면 생성)**
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, "public")));

// 🚀 **업로드된 파일을 정적 폴더로 제공**
app.use("/uploads", express.static(uploadDir));

// 🚀 **라우터 실행 (multer 포함)**
app.use("/", indexRouter);

// 📌 **미들웨어 설정**
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// 📌 **추가 라우터**
app.use("/users", usersRouter);

// ❌ **404 에러 처리**
app.use(function (req, res, next) {
    next(createError(404));
});

// ⚠️ **에러 핸들러**
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.status(err.status || 500);
    res.render("error"); // ← 🚀 **여기에서 EJS 렌더링을 수행해야 하므로 필수**
});

// 🚀 **서버 실행**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;
