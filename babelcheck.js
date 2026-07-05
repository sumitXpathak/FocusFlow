const babel = require('@babel/core');
const fs = require('fs');
const { execSync } = require('child_process');
const files = execSync('find src App.js -name "*.js"').toString().trim().split('\n');
let failed = 0;
for (const f of files) {
  try {
    babel.transformFileSync(f, { presets: ['babel-preset-expo'] });
  } catch (e) {
    failed++;
    console.log('❌ COMPILE ERROR: ' + f);
    console.log('   ' + e.message.split('\n')[0]);
  }
}
console.log(failed === 0 ? '✅ All ' + files.length + ' files compiled cleanly' : failed + ' files failed');
