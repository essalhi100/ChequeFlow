
const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;
const deploymentUrl = 'https://chequeflow-production.up.railway.app';

// إعداد رؤوس CORS والأمان
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', deploymentUrl);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // رؤوس أمان إضافية
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  if (req.url.endsWith('.ts') || req.url.endsWith('.tsx')) {
    res.type('application/javascript');
  }
  next();
});

// خدمة الملفات الثابتة
app.use(express.static(__dirname));

// التعامل مع مسارات SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FINANSSE PRO Deployment Active on: ${deploymentUrl}`);
});
