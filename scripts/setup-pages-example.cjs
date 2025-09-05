const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const exampleDir = path.join(__dirname, '..', 'example', 'github-pages-example');

if (!fs.existsSync(path.join(exampleDir, 'node_modules'))) {
  console.log('Installing GitHub Pages example dependencies...');
  execSync('npm install', { cwd: exampleDir, stdio: 'inherit' });
  console.log('Dependencies installed successfully.');
} else {
  console.log('GitHub Pages example dependencies already installed.');
}