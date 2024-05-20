const fs = require('fs');

const targetPath = '.yarn/plugins/@yarnpkg/plugin-allow-scripts.cjs';
const lines = fs.readFileSync(process.argv[2], 'utf8').split('\n');
let inPluginsSection = false;
let inTargetPluginBlock = false;
const result = [];
lines.forEach((line) => {
  if (line.trim() === 'plugins:') {
    inPluginsSection = true; // Start of plugins section
    result.push(line);
    return;
  }
  if (inPluginsSection) {
    if (line.trim().startsWith('- path:') && line.includes(targetPath)) {
      inTargetPluginBlock = true; // Found the target plugin block, start skipping
      return;
    }
    if (line.trim().startsWith('- path:')) {
      inTargetPluginBlock = false; // Found a new plugin block, ensure not skipping this
    }
    if (line.trim() === '' || !line.startsWith(' ')) {
      inPluginsSection = false; // Likely end of plugins section
      inTargetPluginBlock = false;
    }
    if (!inTargetPluginBlock) {
      result.push(line); // Add line if not in target plugin block
    }
  } else {
    result.push(line); // Outside plugins section, always add line
  }
});
fs.writeFileSync('.yarnrc.yml', result.join('\n'));
