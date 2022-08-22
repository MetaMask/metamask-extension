/**
 * File that generates the index.js file for the icons in:
 * ui/components/component-library/icons/lib
 */

const fs = require('fs');
const path = require('path');

const iconsBaseDir = path.resolve(__dirname, '../lib');

const fileNames = fs
  .readdirSync(iconsBaseDir)
  .filter((file) => file !== 'index.js');

// setup files for index and types index
const indexFileName = path.join(__dirname, '../lib/index.js');

const getIconNameInTitleCase = (fileName) =>
  path
    .basename(fileName, '.js')
    .split('-')
    .map(
      (section) =>
        `${section[0].toUpperCase()}${section.substring(1, section.length)}`,
    )
    .join('');

const indexContent = fileNames.map((fileName) => {
  const iconName = path.basename(getIconNameInTitleCase(fileName), '.js');
  return `export { ${iconName} } from './${path.basename(fileName, '.js')}';\n`;
});

// create index
fs.writeFileSync(indexFileName, '', 'utf8');

// append content to index
indexContent.forEach((line) => {
  fs.appendFileSync(indexFileName, line, 'utf8');
});
