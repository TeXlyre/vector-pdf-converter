const fs = require('fs');
const path = require('path');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDirectoryExists(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirectory(src, dest) {
  ensureDirectoryExists(dest);
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

const exampleDir = path.join(__dirname, '..', 'example', 'github-pages-example');
const distDir = path.join(__dirname, '..', 'dist');
const ghostscriptSrc = path.join(distDir, 'core', 'ghostscript');
const ghostscriptDest = path.join(exampleDir, 'public', 'core', 'ghostscript');

if (fs.existsSync(ghostscriptSrc)) {
  console.log('Copying Ghostscript files to GitHub Pages example...');
  copyDirectory(ghostscriptSrc, ghostscriptDest);
  console.log('Ghostscript files copied successfully.');
} else {
  console.warn('Ghostscript files not found. Make sure to run "npm run build" first.');
}

if (!fs.existsSync(path.join(exampleDir, 'node_modules'))) {
  console.log('Installing GitHub Pages example dependencies...');
  const { execSync } = require('child_process');
  execSync('npm install', { cwd: exampleDir, stdio: 'inherit' });
}