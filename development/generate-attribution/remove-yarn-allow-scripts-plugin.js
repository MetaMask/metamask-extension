const fs = require('fs');

const targetPath = '.yarn/plugins/@yarnpkg/plugin-allow-scripts.cjs';
const yarnrcPath = process.argv[2];
const lines = fs.readFileSync(yarnrcPath, 'utf8').split('\n');
let inPluginsSection = false;
let inTargetPluginBlock = false;
const result = [];
lines.forEach((line) => {
  if (line.trim() === 'plugins:') {
    inPluginsSection = true;
    result.push(line);
    return;
  }
  if (inPluginsSection) {
    if (line.trim().startsWith('- path:') && line.includes(targetPath)) {
      inTargetPluginBlock = true;
      return;
    }
    if (line.trim().startsWith('- path:')) {
      inTargetPluginBlock = false;
    }
    if (line.trim() === '' || !line.startsWith(' ')) {
      inPluginsSection = false;
      inTargetPluginBlock = false;
    }
    if (!inTargetPluginBlock) {
      result.push(line);
    }
  } else {
    result.push(line);
  }
});
fs.writeFileSync('.yarnrc.yml', result.join('\n'));
