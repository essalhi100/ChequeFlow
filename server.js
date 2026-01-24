
const express = require('express');
const path = require('path');
const app = express();

// استخدام المنفذ المقدم من Railway أو افتراضياً 3000
const port = process.env.PORT || 3000;

// إعداد الرؤوس (Headers) لضمان معالجة ملفات TypeScript كـ JavaScript في المتصفح
app.use((req, res, next) => {
  if (req.url.endsWith('.ts') || req.url.endsWith('.tsx')) {
    res.type('application/javascript');
  }
  next();
});

// خدمة الملفات الثابتة من المجلد الجذري
app.use(express.static(__dirname));

// التعامل مع تطبيقات الصفحة الواحدة (SPA)
// أي مسار غير موجود يوجه إلى index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FINANSSE PRO Deployment Active on Port: ${port}`);
});
