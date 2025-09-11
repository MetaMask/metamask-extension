#!/usr/bin/env node

/**
 * Use corepack prepare -o and corepack hydrate to manage yarn versions
 * This approach stores committed tarballs and activates them without yarnPath
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

    console.log(`📦 Managing yarn ${version} using corepack tarballs...`);

    // Ensure .yarn directory exists
    if (!fs.existsSync(yarnDir)) {
      fs.mkdirSync(yarnDir, { recursive: true });
      console.log('✓ Created .yarn directory');
    }

    // Check if tarball already exists
    if (fs.existsSync(tarballPath)) {
      console.log(`✓ Tarball already exists: ${path.relative(process.cwd(), tarballPath)}`);
      console.log('🔄 Hydrating existing tarball...');
    } else {
      // Step 1: Create tarball using corepack prepare -o
      console.log('🔽 Creating tarball with corepack prepare -o...');
      execSync(`corepack prepare yarn@${version} -o`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });

      // Step 2: Move tarball to .yarn directory
      const defaultTarball = path.join(__dirname, '..', 'corepack.tgz');
      if (fs.existsSync(defaultTarball)) {
        fs.renameSync(defaultTarball, tarballPath);
        console.log(`✓ Moved tarball to ${path.relative(process.cwd(), tarballPath)}`);
      } else {
        throw new Error('corepack.tgz was not created');
      }
    }

    // Step 3: Hydrate the tarball to activate the yarn version
    console.log('🚀 Activating yarn version with corepack hydrate...');
    execSync(`corepack hydrate ${tarballPath} --activate`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });

    console.log(`🎉 Successfully activated yarn ${version} using corepack!`);
    console.log(`📌 To commit: git add ${path.relative(process.cwd(), tarballPath)}`);
    console.log(`💡 Note: No yarnPath needed - corepack manages activation automatically`);

    // Step 4: Verify installation
    console.log('🔍 Verifying activation...');
    const testResult = execSync('yarn --version', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    }).trim();

    if (testResult === version) {
      console.log(`✅ Verification successful - yarn --version returns ${testResult}`);
    } else {
      console.warn(`⚠️  Version mismatch - expected ${version}, got ${testResult}`);
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

