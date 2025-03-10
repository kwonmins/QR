const express = require("express");
const multer = require("multer");
const path = require("path"); // ✅ 이거 꼭 있어야 함
const QRCode = require("qrcode");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

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

// Multer 메모리 스토리지 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ✅ 업로드 페이지
router.get("/", (req, res) => {
  res.render("uploads");
});

// ✅ 사진 업로드 및 Supabase 저장
router.post("/upload", upload.array("images", 10), async (req, res) => {
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
});

module.exports = router;
