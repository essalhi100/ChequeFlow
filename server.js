
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Force browser to treat .ts and .tsx files as JavaScript modules
app.use((req, res, next) => {
  if (req.url.endsWith('.ts') || req.url.endsWith('.tsx')) {
    res.type('application/javascript');
  }
  next();
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`FINANSSE PRO is running at http://localhost:${port}`);
});
