const express = require("express");
const multer = require("multer");
const path = require("path"); // ✅ 이거 꼭 있어야 함
const QRCode = require("qrcode");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

<<<<<<< HEAD
// 🔥 Supabase 설정 (너의 Supabase URL과 키 다시 정확히 넣어줘!)
const supabaseUrl = "https://ncvqphdjmvzuyvkdervb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnFwaGRqbXZ6dXl2a2RlcnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4ODk5NCwiZXhwIjoyMDU3MTY0OTk0fQ.NW4C6zH6LtrQdJso-_woSQrkj1eMFEjQCgjbfJKNUMw";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🔥 안전한 파일명 생성 함수 (한글, 특수문자 대응)
const generateSafeFilename = (originalname) => {
  const ext = path.extname(originalname);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};
=======
// 📂 업로드 폴더 확인 및 생성
const uploadDir = path.join(__dirname, "../tmp");
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
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    ); // 고유한 파일명 설정
  },
});
>>>>>>> 18e9b90234b8035fc3bbeee7f4b4fa12af29c519

// Multer 메모리 스토리지 설정
const upload = multer({
<<<<<<< HEAD
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
=======
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("이미지 파일만 업로드 가능합니다!"), false);
    }
    cb(null, true);
  },
>>>>>>> 18e9b90234b8035fc3bbeee7f4b4fa12af29c519
});

// ✅ 업로드 페이지
router.get("/", (req, res) => {
  res.render("uploads");
});

// ✅ 사진 업로드 및 Supabase 저장
router.post("/upload", upload.array("images", 10), async (req, res) => {
<<<<<<< HEAD
  const albumId = `album${Date.now()}`;
  const imageUrls = [];

  try {
    for (const file of req.files) {
      // 🔥 안전한 파일명 사용 (수정된 부분)
      const safeFilename = generateSafeFilename(file.originalname);
      const filename = `${albumId}/${safeFilename}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filename, file.buffer, { contentType: file.mimetype });

      if (uploadError) {
        console.error("스토리지 업로드 에러:", uploadError);
        return res
          .status(500)
          .json({ success: false, message: uploadError.message });
      }

      const { data } = supabase.storage.from("photos").getPublicUrl(filename);
      imageUrls.push(data.publicUrl);
    }

    // 앨범 정보 DB 저장
    const { error: dbError } = await supabase
      .from("albums")
      .insert({ album_id: albumId, image_urls: imageUrls });

    if (dbError) throw new Error(dbError.message);

    const qrCodeData = await QRCode.toDataURL(
      `${req.protocol}://${req.get("host")}/${albumId}`
    );

    res.json({ success: true, albumId, qrCodeData, imageUrls });
  } catch (error) {
    console.error("❌ 업로드 과정에서 에러 발생:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ 앨범 조회
router.get("/:albumId", async (req, res) => {
  const { albumId } = req.params;

  const { data: album, error } = await supabase
    .from("albums")
    .select("image_urls")
    .eq("album_id", albumId)
    .single();

  if (error || !album) {
    console.error("앨범 조회 실패:", error);
    return res.status(404).send(`앨범을 찾을 수 없습니다: ${albumId}`);
  }

  res.render("album", { images: album.image_urls, albumId });
=======
  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "파일 업로드 실패" });
  }

  if (req.files.length > 10) {
    return res.status(400).json({
      success: false,
      message: "최대 10장까지만 업로드할 수 있습니다!",
    });
  }

  const albumId = `album${uploadedAlbums.length + 1}`;
  const imageUrls = req.files.map((file) => `/tmp/${file.filename}`);

  uploadedAlbums.push({ id: albumId, images: imageUrls });

  fs.writeFileSync(resultsFile, JSON.stringify(uploadedAlbums, null, 2));

  try {
    const qrCodeData = await QRCode.toDataURL(
      `http://localhost:3000/${albumId}`
    );
    res.json({ success: true, albumId, qrCodeData });
  } catch (error) {
    console.error("❌ QR 코드 생성 실패:", error);
    res.status(500).json({ success: false, message: "QR 코드 생성 실패" });
  }
});

// ✅ 📌 `GET /albumX` → 여러 장의 사진을 한 페이지에서 렌더링
router.get("/:albumId", (req, res) => {
  console.log("✅ 요청된 albumId:", req.params.albumId);
  console.log(
    "✅ 현재 저장된 앨범 목록:",
    uploadedAlbums.map((album) => album.id)
  );

  const album = uploadedAlbums.find((album) => album.id === req.params.albumId);

  if (!album) {
    console.error("❌ 해당 albumId를 찾을 수 없음:", req.params.albumId);
    return res
      .status(404)
      .send(`해당 페이지를 찾을 수 없습니다: ${req.params.albumId}`);
  }

  res.render("album", { images: album.images, albumId: req.params.albumId });
>>>>>>> 18e9b90234b8035fc3bbeee7f4b4fa12af29c519
});

module.exports = router;
