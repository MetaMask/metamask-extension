const fs = require('fs');
const path = require('path');

// List of deprecated CSS variables and JS tokens
const deprecatedTokens = [
  // CSS variables
  '--brand-colors-grey-grey750',
  '--brand-colors-violet-violet300',
  '--brand-colors-white-white010',
  '--brand-colors-white-white000',
  '--color-primary-disabled',
  '--color-secondary-default',
  '--color-secondary-alternative',
  '--color-secondary-muted',
  '--color-secondary-inverse',
  '--color-secondary-disabled',
  '--color-error-disabled',
  '--color-warning-alternative',
  '--color-warning-disabled',
  '--color-success-alternative',
  '--color-success-disabled',
  '--color-info-alternative',
  '--color-info-disabled',
  '--color-network-goerli-default',
  '--color-network-goerli-inverse',
  '--color-network-localhost-default',
  '--color-network-localhost-inverse',
  '--color-network-sepolia-default',
  '--color-network-sepolia-inverse',
  '--component-button-primary-shadow',
  '--component-button-danger-shadow',

  // JS tokens
  'brandColor.grey750',
  'brandColor.violet300',
  'brandColor.white010',
  'colors.primary.disabled',
  'colors.secondary.default',
  'colors.secondary.alternative',
  'colors.secondary.muted',
  'colors.secondary.inverse',
  'colors.secondary.disabled',
  'colors.error.disabled',
  'colors.warning.alternative',
  'colors.warning.disabled',
  'colors.success.alternative',
  'colors.success.disabled',
  'colors.info.alternative',
  'colors.info.disabled',
  'colors.networks.goerli.default',
  'colors.networks.goerli.inverse',
  'colors.networks.localhost.default',
  'colors.networks.localhost.inverse',
  'colors.networks.sepolia.default',
  'colors.networks.sepolia.inverse',
];

// Function to recursively get all files in a directory
const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach((file) => {
    const fullPath = path.join(dirPath, '/', file);

    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
};

// Function to search for deprecated tokens in a file
const searchFile = (filePath) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  deprecatedTokens.forEach((token) => {
    if (fileContent.includes(token)) {
      console.log(`Deprecated token "${token}" found in file: ${filePath}`);
    }
  });
};

// Main function to search through the codebase
const searchCodebase = (rootDir) => {
  const files = getAllFiles(rootDir);
  const fileExtensions = ['.md', '.js', '.scss', '.css', '.tsx', '.mdx'];
  const currentScript = __filename; // Get the current script's filename

  files.forEach((file) => {
    if (file === currentScript) {
      return; // Skip the current script
    }
    if (fileExtensions.includes(path.extname(file))) {
      searchFile(file);
    }
  });
};

// Run the script
const rootDir = path.resolve(__dirname);
searchCodebase(rootDir);
