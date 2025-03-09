const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// EJS 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공 (업로드된 이미지 접근 가능)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 라우터 설정
const uploadRouter = require('./routes/index');
app.use('/', uploadRouter);

app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
