const express = require("express");
const multer = require("multer");
const path = require("path");
const QRCode = require("qrcode");
const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp"); // 이미지 압축 라이브러리 추가

const router = express.Router();

// Supabase 설정
const supabaseUrl = "https://ncvqphdjmvzuyvkdervb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnFwaGRqbXZ6dXl2a2RlcnZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTU4ODk5NCwiZXhwIjoyMDU3MTY0OTk0fQ.NW4C6zH6LtrQdJso-_woSQrkj1eMFEjQCgjbfJKNUMw"; // 🔥 Supabase 보안 문제로 .env 사용 권장!
const supabase = createClient(supabaseUrl, supabaseKey);

// 안전한 파일명 생성 함수
const generateSafeFilename = (originalname) => {
  const ext = path.extname(originalname);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

// Multer 메모리 스토리지 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("이미지 파일만 업로드 가능합니다!"), false);
    }
    cb(null, true);
  },
});

// 🔥 이미지 압축 함수 (sharp 사용)
const compressImage = async (buffer) => {
  try {
    return await sharp(buffer)
      .resize({ width: 1000 }) // 최대 너비 1000px
      .jpeg({ quality: 70 }) // JPEG로 변환 & 품질 70%
      .toBuffer();
  } catch (error) {
    console.error("이미지 압축 오류:", error);
    throw new Error("이미지 압축 중 오류 발생");
  }
};

// 업로드 페이지 렌더링
router.get("/", (req, res) => {
  res.render("uploads");
});

// 사진 업로드 및 Supabase 저장, QR 생성
router.post("/upload", upload.array("images", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "파일이 없습니다." });
  }

  const albumId = `album${Date.now()}`;
  const imageUrls = [];

  try {
    for (const file of req.files) {
      const safeFilename = generateSafeFilename(file.originalname);
      const filename = `${albumId}/${safeFilename}`;

      // 🔥 이미지 압축 수행
      const compressedBuffer = await compressImage(file.buffer);

      // Supabase에 업로드
      const { data, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filename, compressedBuffer, { contentType: "image/jpeg" });

      if (uploadError) {
        console.error("스토리지 업로드 에러:", uploadError);
        return res
          .status(500)
          .json({ success: false, message: "Supabase 업로드 실패!" });
      }

      // ✅ 올바른 URL 가져오기 코드
      const publicUrl = supabase.storage.from("photos").getPublicUrl(filename)
        .data.publicUrl;

      if (!publicUrl) {
        return res
          .status(500)
          .json({ success: false, message: "파일 URL을 가져오지 못했습니다!" });
      }
      imageUrls.push(publicUrl);
    }

    // Supabase DB에 앨범정보 저장
    const { error: dbError } = await supabase
      .from("albums")
      .insert([{ album_id: albumId, image_urls: imageUrls }]);

    if (dbError) {
      console.error("데이터베이스 저장 에러:", dbError);
      return res.status(500).json({ success: false, message: "DB 저장 실패!" });
    }

    // 🔥 QR 코드 생성
    let qrCodeData = null;
    try {
      qrCodeData = await QRCode.toDataURL(
        `${req.protocol}://${req.get("host")}/${albumId}`
      );
    } catch (qrError) {
      console.error("QR 코드 생성 오류:", qrError);
      qrCodeData = null;
    }

    res.json({ success: true, albumId, qrCodeData, imageUrls });
  } catch (error) {
    console.error("🔥 업로드 중 에러:", error);
    res.status(500).json({ success: false, message: "서버 내부 오류 발생!" });
  }
});

// 앨범 조회
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
});

module.exports = router;
