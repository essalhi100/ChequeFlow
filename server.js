
const express = require('express');
const path = require('path');
const fs = require('fs');
const { transform } = require('sucrase');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS and clear headers for a smooth dev experience
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Middleware to transform TSX/TS files on the fly
app.use((req, res, next) => {
  const urlPath = req.path.split('?')[0];
  // Clean path: handle both /file.tsx and file.tsx
  const cleanPath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
  const ext = path.extname(cleanPath);
  
  if (ext === '.ts' || ext === '.tsx' || cleanPath === 'index.tsx') {
    const filePath = path.join(__dirname, cleanPath === '' ? 'index.tsx' : cleanPath);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = transform(content, {
          transforms: ['typescript', 'jsx'],
          production: true,
          jsxPragma: 'React.createElement',
          jsxFragmentPragma: 'React.Fragment'
        });
        
        let code = result.code;
        // Inject environment variables safely
        const envKeys = ['API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
        envKeys.forEach(key => {
          const val = process.env[key] || '';
          const regex = new RegExp(`process\\.env\\.${key}(?![a-zA-Z0-9_])`, 'g');
          code = code.replace(regex, JSON.stringify(val));
        });
        
        res.set('Content-Type', 'application/javascript');
        return res.send(code);
      } catch (err) {
        console.error(`Error transpiling ${cleanPath}:`, err);
        return res.status(500).send(`/* Server Transpilation Error: ${err.message} */`);
      }
    }
  }
  next();
});

// Serve static assets
app.use(express.static(__dirname));

// SPA fallback: redirect all unknown paths to index.html
app.get('*', (req, res) => {
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return res.status(404).send('Resource not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FINANSSE PRO Server active on port ${port}`);
});
