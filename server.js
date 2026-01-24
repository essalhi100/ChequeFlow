
const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;
const deploymentUrl = 'https://chequeflow-production.up.railway.app';

// 1. إعدادات CORS المتقدمة والأمان
app.use((req, res, next) => {
  // السماح بالاتصال من رابط المشروع ومن البيئة المحلية للتطوير
  const origin = req.headers.origin;
  if (origin && (origin === deploymentUrl || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', deploymentUrl);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // 2. معالجة أنواع الملفات (MIME Types)
  // التأكد من أن المتصفح يعامل ملفات .ts و .tsx كملفات JavaScript
  if (req.url.endsWith('.ts') || req.url.endsWith('.tsx')) {
    res.type('application/javascript');
  }

  // رؤوس الأمان الأساسية
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 3. خدمة الملفات الثابتة من المجلد الرئيسي
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// 4. حماية مسارات SPA ومنع الخطأ Unexpected token '<'
// نمنع إرسال index.html إذا كان الطلب يبحث عن ملف (ينتهي بامتداد مثل .js أو .ts) ولكنه غير موجود
app.get('*', (req, res) => {
  const ext = path.extname(req.url);
  if (ext && ext !== '.html') {
    return res.status(404).send('File not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FINANSSE PRO Deployment Active on: ${deploymentUrl}`);
});
