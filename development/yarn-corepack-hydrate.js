#!/usr/bin/env node

/**
 * Hydrate an existing yarn corepack tarball to activate the yarn version
 * This script finds and activates the tarball for the version specified in package.json
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Get yarn version from package.json packageManager field
 */
function getYarnVersionFromPackageJson() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageManager = packageJson.packageManager;

  if (!packageManager || !packageManager.startsWith('yarn@')) {
    throw new Error('No yarn version found in package.json packageManager field');
  }

  return packageManager.split('@')[1];
}

/**
 * Main execution
 */
function main() {
  try {
    const version = getYarnVersionFromPackageJson();
    const yarnDir = path.join(__dirname, '..', '.yarn');
    const tarballPath = path.join(yarnDir, `yarn-${version}-corepack.tgz`);

    console.log(`🔍 Looking for yarn ${version} tarball...`);

    // Check if tarball exists
    if (!fs.existsSync(tarballPath)) {
      console.error(`❌ Tarball not found: ${path.relative(process.cwd(), tarballPath)}`);
      console.log(`💡 Run 'yarn yarn-binary:download' to create the tarball first`);
      process.exit(1);
    }

    console.log(`✓ Found tarball: ${path.relative(process.cwd(), tarballPath)}`);

    // Hydrate the tarball to activate the yarn version
    console.log('🚀 Activating yarn version with corepack hydrate...');
    execSync(`corepack hydrate ${tarballPath} --activate`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });

    console.log(`🎉 Successfully activated yarn ${version}!`);

    // Verify activation
    console.log('🔍 Verifying activation...');
    const testResult = execSync('yarn --version', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    }).trim();

    if (testResult === version) {
      console.log(`✅ Verification successful - yarn --version returns ${testResult}`);
    } else {
      console.warn(`⚠️  Version mismatch - expected ${version}, got ${testResult}`);
      console.log(`💡 This might happen if corepack is using the package.json version instead`);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { getYarnVersionFromPackageJson };

