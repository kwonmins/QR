const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");

const router = express.Router();

// 📂 업로드 폴더 확인 및 생성
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 업로드된 앨범을 저장할 리스트 (서버 재시작 후에도 유지)
let uploadedAlbums = [];
const resultsFile = path.join(__dirname, "../results.json");

// 🔹 서버가 시작될 때 기존 업로드된 데이터 복원
if (fs.existsSync(resultsFile)) {
    uploadedAlbums = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
}

// 🚀 Multer 설정 (여러 장 업로드 가능)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname)); // 고유한 파일명 설정
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("이미지 파일만 업로드 가능합니다!"), false);
        }
        cb(null, true);
    }
});

// ✅ 📌 `GET /` → 업로드 페이지 렌더링 (`uploads.ejs`)
router.get("/", (req, res) => {
    res.render("uploads");
});

// ✅ `POST /upload` → 여러 장의 사진을 하나의 앨범으로 업로드
router.post("/upload", upload.array("images", 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "파일 업로드 실패" });
    }

    if (req.files.length > 10) {
        return res.status(400).json({ success: false, message: "최대 10장까지만 업로드할 수 있습니다!" });
    }

    const albumId = `album${uploadedAlbums.length + 1}`;
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    uploadedAlbums.push({ id: albumId, images: imageUrls });

    fs.writeFileSync(resultsFile, JSON.stringify(uploadedAlbums, null, 2));

    try {
        const qrCodeData = await QRCode.toDataURL(`http://localhost:3000/${albumId}`);
        res.json({ success: true, albumId, qrCodeData });
    } catch (error) {
        console.error("❌ QR 코드 생성 실패:", error);
        res.status(500).json({ success: false, message: "QR 코드 생성 실패" });
    }
});

// ✅ 📌 `GET /albumX` → 여러 장의 사진을 한 페이지에서 렌더링
router.get("/:albumId", (req, res) => {
    console.log("✅ 요청된 albumId:", req.params.albumId);
    console.log("✅ 현재 저장된 앨범 목록:", uploadedAlbums.map(album => album.id));

    const album = uploadedAlbums.find(album => album.id === req.params.albumId);

    if (!album) {
        console.error("❌ 해당 albumId를 찾을 수 없음:", req.params.albumId);
        return res.status(404).send(`해당 페이지를 찾을 수 없습니다: ${req.params.albumId}`);
    }

    res.render("album", { images: album.images, albumId: req.params.albumId });
});

module.exports = router;
