
const express = require('express');
const path = require('path');
const fs = require('fs');
const { transform } = require('sucrase');

const app = express();
const port = process.env.PORT || 3000;
const deploymentUrl = 'https://chequeflow-production.up.railway.app';

// Middleware لتحويل ملفات TypeScript و JSX إلى JavaScript
app.use((req, res, next) => {
  const ext = path.extname(req.url);
  if (ext === '.ts' || ext === '.tsx') {
    const filePath = path.join(__dirname, req.url);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // تحويل الكود باستخدام sucrase
        const result = transform(content, {
          transforms: ['typescript', 'jsx'],
          production: true
        });
        
        res.set('Content-Type', 'application/javascript');
        return res.send(result.code);
      } catch (err) {
        console.error(`Error transpiling ${req.url}:`, err);
        return res.status(500).send(`Transpilation Error: ${err.message}`);
      }
    }
  }
  next();
});

// إعدادات CORS والأمان
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin === deploymentUrl || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', deploymentUrl);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// خدمة الملفات الثابتة
app.use(express.static(__dirname));

// التعامل مع مسارات SPA
app.get('*', (req, res) => {
  if (path.extname(req.url)) return res.status(404).send('Resource not found');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FINANSSE PRO Deployment Active on: ${deploymentUrl}`);
});
