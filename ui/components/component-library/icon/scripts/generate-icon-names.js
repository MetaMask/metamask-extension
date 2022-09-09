/**
 * File that generates iconNames.js for the icons in app/images/icons
 * This file is used by the Icon component to map the icon name to the
 * correct icon file.
 *
 * Use yarn build:icons to generate the iconNames.js file
 * and the correct styles in icon.scss
 */
const fs = require('fs');
const path = require('path');

const SVG_ICONS_FOLDER = '../../../../app/images/icons';
const GENERATED_ICON_NAMES_FILE = 'iconNames.js';
const ASSET_EXT = '.svg';

const getIconNameKebabCase = (fileName) =>
  path.basename(fileName, ASSET_EXT).replace('icon-', '');

const getIconNameInSnakeCase = (fileName) =>
  path
    .basename(fileName, ASSET_EXT)
    .replace('icon-', '')
    .replace(/-/gu, '_')
    .toUpperCase();

const main = async () => {
  const svgIconsFolderPath = path.join(__dirname, `../${SVG_ICONS_FOLDER}`);

  const generatedIconNamesFilePath = path.join(
    __dirname,
    `../${GENERATED_ICON_NAMES_FILE}`,
  );

  const fileList = fs.readdirSync(svgIconsFolderPath);

  const svgIconsFileList = fileList.filter(
    (fileName) => path.extname(fileName) === ASSET_EXT,
  );

  fs.writeFileSync(generatedIconNamesFilePath, '');

  fs.appendFileSync(
    generatedIconNamesFilePath,
    `// This is a generated file\n// DO NOT EDIT - Use ./scripts/generate-icon-names.js\n\nexport const ICON_NAMES = {\n`,
  );

  svgIconsFileList.forEach((fileName) => {
    fs.appendFileSync(
      generatedIconNamesFilePath,
      `  ${getIconNameInSnakeCase(fileName)}: '${getIconNameKebabCase(
        fileName,
      )}',\n`,
    );
  });

  fs.appendFileSync(generatedIconNamesFilePath, `};\n`);
};
main();
