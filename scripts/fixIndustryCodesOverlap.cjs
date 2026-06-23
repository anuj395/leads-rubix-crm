// scripts/fixIndustryCodesOverlap.cjs
const fs = require('fs');
const path = require('path');

const mapping = {
  'temp0010': 'temp0010',
  'temp0011': 'temp0011',
  'temp0012': 'temp0012',
};

function walkAndReplace(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git' || file === '.local' || file === '.gemini' || file === 'scratch' || file === 'attached_assets') {
        continue;
      }
      walkAndReplace(filePath);
    } else {
      const ext = path.extname(file);
      if (['.js', '.ts', '.tsx', '.json', '.cjs', '.mjs'].includes(ext)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;
        for (const [oldCode, newCode] of Object.entries(mapping)) {
          if (content.includes(oldCode)) {
            const regex = new RegExp(oldCode, 'g');
            content = content.replace(regex, newCode);
            changed = true;
          }
        }
        if (changed) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`[files] Fixed codes in: ${filePath}`);
        }
      }
    }
  }
}

console.log('--- Fixing Overlap in Industry Codes ---');
walkAndReplace(path.join(__dirname, '..'));
console.log('--- Overlap Fix Completed ---');
