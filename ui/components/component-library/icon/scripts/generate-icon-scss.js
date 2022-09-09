/**
 * File that generates the sass for the icon mask css
 */
const fs = require('fs');
const path = require('path');

const SVG_ICONS_FOLDER = '../../../../app/images/icons';
const ICON_SCSS_FILE = 'icon.scss';
const SCSS_CONTENT_TO_DETECT =
  '// DO NOT EDIT - Use ./scripts/generate-icon-scss.js';
const ASSET_EXT = '.svg';

const getIconNameKebabCase = (fileName) =>
  path.basename(fileName, ASSET_EXT).replace('icon-', '');

const main = async () => {
  const svgIconsFolderPath = path.join(__dirname, `../${SVG_ICONS_FOLDER}`);

  const iconScssFilePath = path.join(__dirname, `../${ICON_SCSS_FILE}`);

  const svgIconsFileList = fs.readdirSync(svgIconsFolderPath);

  const svgIconsFileListSvgsOnly = svgIconsFileList.filter(
    (fileName) => path.extname(fileName) === ASSET_EXT,
  );

  let iconScssContentToWrite = '';
  const iconScssFileContent = fs.readFileSync(iconScssFilePath, {
    encoding: 'utf8',
  });

  const indexToRemove = iconScssFileContent.indexOf(SCSS_CONTENT_TO_DETECT);

  const baseTypesFileContent = iconScssFileContent.substring(0, indexToRemove);

  iconScssContentToWrite += `${baseTypesFileContent}${SCSS_CONTENT_TO_DETECT}\n  ///////////////////////////////////////////////////////`;

  iconScssContentToWrite += '\n\n  // Icon names';

  svgIconsFileListSvgsOnly.forEach((fileName) => {
    iconScssContentToWrite += `
  &--${getIconNameKebabCase(fileName)} {
    -webkit-mask-image: url('/images/icons/${fileName}');
    mask-image: url('/images/icons/${fileName}');
  }\n`;
  });

  iconScssContentToWrite += '}\n';

  fs.writeFileSync(iconScssFilePath, iconScssContentToWrite);
};

main();
