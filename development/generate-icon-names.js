/**
 * Generate icon names
 *
 * Reads all the icon svg files in app/images/icons
 * and returns an object of icon name key value pairs
 * stored in the environment variable ICON_NAMES
 * Used with the Icon component in ./ui/components/component-library/icon/icon.js
 */
const fs = require('fs');
const path = require('path');

const SVG_ICONS_FOLDER = './app/images/icons';
const ASSET_EXT = '.svg';

const getIconNameKebabCase = (fileName) => path.basename(fileName, ASSET_EXT);

const getIconNameInSnakeCase = (fileName) =>
  path.basename(fileName, ASSET_EXT).replace(/-/gu, '_').toUpperCase();

const generateIconNames = () => {
  const iconNames = {};

  const svgIconsFolderPath = path.join(__dirname, `../${SVG_ICONS_FOLDER}`);

  const fileList = fs.readdirSync(svgIconsFolderPath);

  const svgIconsFileList = fileList.filter(
    (fileName) => path.extname(fileName) === ASSET_EXT,
  );

  svgIconsFileList.forEach(
    (fileName) =>
      (iconNames[getIconNameInSnakeCase(fileName)] =
        getIconNameKebabCase(fileName)),
  );

  const iconNamesStringified = JSON.stringify(iconNames);

  return iconNamesStringified;
};

module.exports = { generateIconNames };
