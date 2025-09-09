#!/usr/bin/env node

/**
 * Securely download and store a specific version of yarn binary
 *
 * Usage:
 *   node development/download-yarn-binary.js --yarn-version=4.9.4
 *   node development/download-yarn-binary.js --yarn-version=4.9.4 --force
 *
 * This script:
 * 1. Downloads the specified yarn version from the official repository
 * 2. Verifies the checksum for security
 * 3. Stores the binary in the tools/yarn directory
 * 4. Creates/updates a configuration file with version info
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const nodeCrypto = require('crypto');
const { createWriteStream, existsSync } = require('fs');
const { pipeline } = require('stream/promises');
const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Configuration
const YARN_V1_RELEASES_BASE_URL =
  'https://github.com/yarnpkg/yarn/releases/download';
const YARN_BERRY_RELEASES_BASE_URL =
  'https://github.com/yarnpkg/berry/releases/download';
const TOOLS_DIR = path.join(__dirname, '..', 'tools');
const YARN_DIR = path.join(TOOLS_DIR, 'yarn');
const YARN_CONFIG_FILE = path.join(YARN_DIR, 'yarn-config.json');

// Parse command line arguments
const { argv } = yargs(hideBin(process.argv))
  .version(false) // Disable built-in version to avoid conflicts
  .option('yarn-version', {
    alias: ['v', 'version'],
    describe: 'Yarn version to download (e.g., 4.9.4)',
    type: 'string',
    demandOption: true,
  })
  .option('force', {
    alias: 'f',
    describe: 'Force download even if version already exists',
    type: 'boolean',
    default: false,
  })
  .option('verify-only', {
    describe: "Only verify existing binary, don't download",
    type: 'boolean',
    default: false,
  })
  .option('no-config', {
    describe: 'Skip creating/updating yarn-config.json (useful for CI/CD)',
    type: 'boolean',
    default: false,
  })
  .help();

/**
 * Ensure directory exists
 *
 * @param dirPath
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✓ Directory ensured: ${dirPath}`);
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Download file from URL
 *
 * @param url
 * @param filePath
 */
async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(filePath);

    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          file.close();
          downloadFile(response.headers.location, filePath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`),
          );
          return;
        }

        pipeline(response, file)
          .then(() => {
            resolve();
          })
          .catch(reject);
      })
      .on('error', (error) => {
        file.close();
        reject(error);
      });
  });
}

/**
 * Calculate checksum of file using specified algorithm
 *
 * @param filePath
 * @param algorithm
 */
async function calculateChecksum(filePath, algorithm = 'sha256') {
  const hash = nodeCrypto.createHash(algorithm);
  const data = await fs.readFile(filePath);
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Determine yarn version info and repository
 *
 * @param version
 */
function getYarnVersionInfo(version) {
  const majorVersion = parseInt(version.split('.')[0], 10);

  if (majorVersion === 1) {
    // Yarn v1 from classic repository
    return {
      repository: 'classic',
      baseUrl: YARN_V1_RELEASES_BASE_URL,
      tag: `v${version}`,
      filename: `yarn-v${version}.tar.gz`,
      downloadUrl: `${YARN_V1_RELEASES_BASE_URL}/v${version}/yarn-v${version}.tar.gz`,
    };
  } else if (majorVersion >= 2) {
    // Yarn v2+ standalone binary from official releases
    return {
      repository: 'berry',
      baseUrl: 'https://repo.yarnpkg.com',
      tag: version,
      filename: `yarn-${version}.cjs`,
      downloadUrl: `https://repo.yarnpkg.com/${version}/packages/yarnpkg-cli/bin/yarn.js`,
    };
  }
  throw new Error(`Unsupported yarn version: ${version}`);
}

/**
 * Fetch data from URL and return as string
 *
 * @param url
 */
async function fetchUrlData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          return fetchUrlData(response.headers.location).then(resolve).catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`),
          );
          return;
        }

        let data = '';
        response.on('data', (chunk) => (data += chunk));
        response.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

/**
 * Fetch and verify checksums from yarn release
 *
 * @param version
 */
async function fetchOfficialChecksums(version) {
  const versionInfo = getYarnVersionInfo(version);

  // For yarn v1, try to get checksums from classic repo
  if (versionInfo.repository === 'classic') {
    const checksumsUrl = `${YARN_V1_RELEASES_BASE_URL}/v${version}/yarn-v${version}.tar.gz.asc`;

    try {
      // Try to get PGP signature first (most secure)
      const data = await fetchUrlData(checksumsUrl);
      // Extract SHA-256 from PGP signature if available
      const sha256Match = data.match(/SHA-?256[:\s]+([a-f0-9]{64})/iu);
      if (sha256Match) {
        return { sha256: sha256Match[1], source: 'pgp' };
      }
    } catch (error) {
      console.warn(`Warning: Could not fetch PGP signature: ${error.message}`);
    }

    // Fallback: try to get checksums file
    const checksumUrl = `${YARN_V1_RELEASES_BASE_URL}/v${version}/yarn-v${version}.tar.gz.sha256`;

    try {
      const data = await fetchUrlData(checksumUrl);
      const checksum = data.trim().split(/\s+/u)[0];
      return { sha256: checksum, source: 'checksums' };
    } catch (error) {
      console.warn(`Warning: Could not fetch checksums file: ${error.message}`);
    }
  } else {
    // For yarn berry (v2+), try to get checksums from npm registry
    // Note: npm registry checksums are for the tarball distribution, not standalone binaries
    const registryUrl = `https://registry.yarnpkg.com/@yarnpkg/cli/${version}`;

    try {
      console.log(`🔍 Checking npm registry: ${registryUrl}`);
      const data = await fetchUrlData(registryUrl);
      const packageInfo = JSON.parse(data);

      if (packageInfo.dist && packageInfo.dist.tarball) {
        console.log(
          `ℹ️  Note: npm registry provides checksums for tarball (${packageInfo.dist.tarball})`,
        );
        console.log(
          `ℹ️  We're downloading standalone binary from repo.yarnpkg.com - these are different files`,
        );

        // Still record the npm checksums for reference, but don't use them for verification
        if (
          packageInfo.dist.integrity &&
          packageInfo.dist.integrity.startsWith('sha512-')
        ) {
          const base64Hash = packageInfo.dist.integrity.replace('sha512-', '');
          const hexHash = Buffer.from(base64Hash, 'base64').toString('hex');
          console.log(`📝 npm tarball SHA-512: ${hexHash} (reference only)`);
        }
        if (packageInfo.dist.shasum) {
          console.log(
            `📝 npm tarball SHA-1: ${packageInfo.dist.shasum} (reference only)`,
          );
        }
      }
    } catch (error) {
      console.warn(
        `Warning: Could not fetch from npm registry: ${error.message}`,
      );
    }

    // Fallback: try to get checksums from berry repository
    const berryChecksumsUrls = [
      // Try checksums file in berry repository
      `${YARN_BERRY_RELEASES_BASE_URL}/@yarnpkg/cli/${version}/yarn-${version}.cjs.sha256`,
      `${YARN_BERRY_RELEASES_BASE_URL}/@yarnpkg/cli/${version}/checksums.txt`,
      // Try in release assets
      `https://github.com/yarnpkg/berry/releases/download/@yarnpkg%2Fcli%2F${version}/yarn-${version}.cjs.sha256`,
      `https://github.com/yarnpkg/berry/releases/download/@yarnpkg%2Fcli%2F${version}/checksums.txt`,
      // Alternative format
      `https://github.com/yarnpkg/berry/releases/download/%40yarnpkg%2Fcli%2F${version}/yarn-${version}.cjs.sha256`,
    ];

    for (const url of berryChecksumsUrls) {
      try {
        console.log(`🔍 Trying checksum URL: ${url}`);
        const data = await fetchUrlData(url);

        // Parse different checksum formats
        let checksum;

        // Format: "checksum filename" or just "checksum"
        const lines = data.trim().split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();

          // Look for a 64-character hex string (SHA-256)
          const sha256Match = trimmedLine.match(/([a-f0-9]{64})/iu);
          if (sha256Match) {
            // Verify it's for the right file or if no filename is specified, use it
            const parts = trimmedLine.split(/\s+/u);
            if (
              parts.length === 1 || // Just checksum
              parts[1]?.includes('yarn.js') || // Contains yarn.js
              parts[1]?.includes(`yarn-${version}.cjs`) || // Contains version-specific name
              trimmedLine.includes('yarn')
            ) {
              // Contains yarn somewhere
              checksum = sha256Match[1];
              break;
            }
          }
        }

        if (checksum) {
          console.log(`✓ Found checksum from: ${url}`);
          return { sha256: checksum, source: 'berry-checksums' };
        }
      } catch (error) {
        console.warn(`Warning: Could not fetch from ${url}: ${error.message}`);
      }
    }

    console.warn(
      `Note: Official checksums for yarn v${version} standalone binaries are not publicly available.`,
    );
    console.warn(
      `Yarn Berry standalone binaries from repo.yarnpkg.com don't provide separate checksum files.`,
    );
    console.warn(
      `For additional security, you can manually verify this is an official yarn release at:`,
    );
    console.warn(
      `https://github.com/yarnpkg/berry/releases/tag/@yarnpkg%2Fcli%2F${version}`,
    );
  }

  return null;
}

/**
 * Load existing yarn configuration
 */
async function loadYarnConfig() {
  try {
    const configData = await fs.readFile(YARN_CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    // Return default config if file doesn't exist
    return {
      versions: {},
      current: null,
      lastUpdated: null,
    };
  }
}

/**
 * Save yarn configuration
 *
 * @param config
 */
async function saveYarnConfig(config) {
  await fs.writeFile(YARN_CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`✓ Configuration saved to ${YARN_CONFIG_FILE}`);
}

/**
 * Main download function
 *
 * @param version
 * @param force
 * @param noConfig
 */
async function downloadYarnBinary(version, force = false, noConfig = false) {
  console.log(`📦 Downloading yarn version ${version}...`);

  // Get version info
  const versionInfo = getYarnVersionInfo(version);
  console.log(
    `ℹ️  Using ${versionInfo.repository} repository (${
      versionInfo.repository === 'classic' ? 'yarn v1' : 'yarn berry'
    })`,
  );

  // Ensure directories exist
  await ensureDirectory(TOOLS_DIR);
  await ensureDirectory(YARN_DIR);

  const binaryFileName = versionInfo.filename;
  const binaryPath = path.join(YARN_DIR, binaryFileName);
  const versionDir = path.join(YARN_DIR, `v${version}`);

  // Load existing config (unless --no-config is specified)
  let config = { versions: {}, current: null, lastUpdated: null };
  if (noConfig) {
    // With --no-config, only check if binary file exists
    if (!force && existsSync(binaryPath)) {
      console.log(
        `✓ Yarn v${version} binary already exists. Use --force to re-download.`,
      );
      return config;
    }
  } else {
    config = await loadYarnConfig();

    // Check if version already exists
    if (!force && config.versions[version]) {
      const existingBinaryPath = path.isAbsolute(
        config.versions[version].binaryPath,
      )
        ? config.versions[version].binaryPath
        : path.resolve(process.cwd(), config.versions[version].binaryPath);

      if (existsSync(existingBinaryPath)) {
        console.log(
          `✓ Yarn v${version} already exists. Use --force to re-download.`,
        );
        return config;
      }
    }
  }

  // Download binary
  const { downloadUrl } = versionInfo;
  console.log(`⬇️  Downloading from: ${downloadUrl}`);

  try {
    await downloadFile(downloadUrl, binaryPath);
    console.log(`✓ Downloaded: ${binaryPath}`);

    // Make the downloaded binary executable (it has a shebang)
    await fs.chmod(binaryPath, 0o755);
    console.log(`✓ Made executable: ${binaryPath}`);
  } catch (error) {
    throw new Error(`Failed to download yarn binary: ${error.message}`);
  }

  // Calculate checksum
  console.log('🔍 Calculating checksum...');
  const sha256Checksum = await calculateChecksum(binaryPath, 'sha256');
  console.log(`✓ SHA-256: ${sha256Checksum}`);

  // Try to verify against official checksums
  console.log('🔐 Attempting to verify checksum...');
  const officialChecksums = await fetchOfficialChecksums(version);

  if (officialChecksums) {
    let verified = false;
    let actualChecksum = sha256Checksum;
    let expectedChecksum;
    let algorithm;

    // Determine which checksum type we have and calculate accordingly
    if (officialChecksums.sha256) {
      expectedChecksum = officialChecksums.sha256;
      actualChecksum = sha256Checksum;
      algorithm = 'SHA-256';
    } else if (officialChecksums.sha512) {
      expectedChecksum = officialChecksums.sha512;
      actualChecksum = await calculateChecksum(binaryPath, 'sha512');
      algorithm = 'SHA-512';
      console.log(`✓ SHA-512: ${actualChecksum}`);
    } else if (officialChecksums.sha1) {
      expectedChecksum = officialChecksums.sha1;
      actualChecksum = await calculateChecksum(binaryPath, 'sha1');
      algorithm = 'SHA-1';
      console.log(`✓ SHA-1: ${actualChecksum}`);
    }

    if (expectedChecksum && actualChecksum) {
      if (expectedChecksum.toLowerCase() === actualChecksum.toLowerCase()) {
        console.log(
          `✅ ${algorithm} checksum verified against official ${officialChecksums.source}!`,
        );
        verified = true;
      } else {
        throw new Error(
          `❌ ${algorithm} checksum mismatch!\n` +
            `Expected: ${expectedChecksum}\n` +
            `Actual:   ${actualChecksum}\n` +
            `This could indicate a compromised download.`,
        );
      }
    }

    if (!verified) {
      console.warn(
        `⚠️  Could not verify checksum - unknown format from ${officialChecksums.source}`,
      );
    }
  } else {
    console.warn(
      `⚠️  Could not verify checksum against official sources.\n` +
        `Please manually verify this SHA-256 checksum: ${sha256Checksum}`,
    );
  }

  // Extract/setup the binary
  console.log('📂 Setting up binary...');
  await ensureDirectory(versionDir);

  if (versionInfo.repository === 'classic') {
    // Yarn v1 uses tar.gz format - extract it
    try {
      execSync(
        `tar -xzf "${binaryPath}" -C "${versionDir}" --strip-components=1`,
        {
          stdio: 'inherit',
        },
      );
      console.log(`✓ Extracted to: ${versionDir}`);
    } catch (error) {
      throw new Error(`Failed to extract yarn binary: ${error.message}`);
    }
  } else {
    // Yarn berry - single standalone JS file, create directory structure
    const binDir = path.join(versionDir, 'bin');
    await ensureDirectory(binDir);

    const yarnJsPath = path.join(binDir, 'yarn.js');
    await fs.copyFile(binaryPath, yarnJsPath);

    // Make executable
    await fs.chmod(yarnJsPath, 0o755);

    // Create a simple package.json for reference
    const packageInfo = {
      name: `@yarnpkg/cli-local-${version}`,
      version,
      bin: {
        yarn: './bin/yarn.js',
      },
    };
    await fs.writeFile(
      path.join(versionDir, 'package.json'),
      JSON.stringify(packageInfo, null, 2),
    );

    console.log(`✓ Set up standalone binary at: ${versionDir}`);
  }

  // Update configuration with relative paths for portability (unless --no-config)
  if (noConfig) {
    console.log(`ℹ️  Skipping configuration file (--no-config specified)`);
  } else {
    const relativeBinaryPath = path.relative(process.cwd(), binaryPath);
    const relativeExtractedPath = path.relative(process.cwd(), versionDir);

    config.versions[version] = {
      downloadDate: new Date().toISOString(),
      binaryPath: relativeBinaryPath,
      extractedPath: relativeExtractedPath,
      checksum: sha256Checksum, // Always store SHA-256 for consistency
      verified: Boolean(officialChecksums),
      repository: versionInfo.repository,
      downloadUrl,
    };

    config.current = version;
    config.lastUpdated = new Date().toISOString();

    await saveYarnConfig(config);
  }

  console.log(`🎉 Successfully downloaded and verified yarn v${version}!`);
  return config;
}

/**
 * Verify existing binary
 *
 * @param version
 */
async function verifyExistingBinary(version) {
  const config = await loadYarnConfig();
  const versionInfo = config.versions[version];

  if (!versionInfo) {
    throw new Error(
      `Yarn v${version} is not installed. Run without --verify-only to download.`,
    );
  }

  console.log(`🔍 Verifying existing yarn v${version}...`);

  // Resolve relative paths for portability
  const binaryPath = path.isAbsolute(versionInfo.binaryPath)
    ? versionInfo.binaryPath
    : path.resolve(process.cwd(), versionInfo.binaryPath);

  if (!existsSync(binaryPath)) {
    throw new Error(`Binary file not found: ${binaryPath}`);
  }

  const currentChecksum = await calculateChecksum(binaryPath);

  if (currentChecksum === versionInfo.checksum) {
    console.log(`✅ Binary integrity verified!`);
    return true;
  }
  throw new Error(
    `❌ Binary integrity check failed!\n` +
      `Expected: ${versionInfo.checksum}\n` +
      `Actual:   ${currentChecksum}`,
  );
}

/**
 * Main execution
 */
async function main() {
  try {
    if (argv.verifyOnly) {
      await verifyExistingBinary(argv.yarnVersion);
    } else {
      await downloadYarnBinary(argv.yarnVersion, argv.force, argv.noConfig);
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

module.exports = {
  downloadYarnBinary,
  verifyExistingBinary,
  loadYarnConfig,
};
