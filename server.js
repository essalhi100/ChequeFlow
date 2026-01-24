
const express = require('express');
const path = require('path');
const fs = require('fs');
const { transform } = require('sucrase');

const app = express();
const port = process.env.PORT || 3000;

// تسجيل الطلبات للمساعدة في تصحيح الأخطاء (Logging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 1. إعدادات CORS ورؤوس الأمان
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 2. تحويل ملفات TypeScript و JSX فورياً (On-the-fly Transpilation)
app.use((req, res, next) => {
  const ext = path.extname(req.path);
  if (ext === '.ts' || ext === '.tsx') {
    const filePath = path.join(__dirname, req.path);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // تحويل الكود باستخدام sucrase
        const result = transform(content, {
          transforms: ['typescript', 'jsx'],
          production: true,
          jsxPragma: 'React.createElement',
          jsxFragmentPragma: 'React.Fragment'
        });
        
        res.set('Content-Type', 'application/javascript');
        return res.send(result.code);
      } catch (err) {
        console.error(`Transpilation error for ${req.path}:`, err);
        res.set('Content-Type', 'application/javascript');
        return res.status(500).send(`/* Transpilation Error: ${err.message} */`);
      }
    } else {
      console.warn(`File not found: ${filePath}`);
      // نرسل 404 صريح بدلاً من تمريره للـ SPA لتجنب خطأ الـ Syntax
      return res.status(404).set('Content-Type', 'text/plain').send('File not found');
    }
  }
  next();
});

// 3. خدمة الملفات الثابتة
app.use(express.static(__dirname));

// 4. معالجة مسارات SPA (Single Page Application)
app.get('*', (req, res) => {
  // نمنع إرسال index.html إذا كان الطلب يبحث عن أصل (Asset) غير موجود
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.status(404).send('Resource not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FINANSSE PRO Server listening on port ${port}`);
});
