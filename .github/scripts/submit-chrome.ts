#!/usr/bin/env tsx

import { existsSync } from 'fs';
import { resolve } from 'path';

console.log('🚀 Starting Chrome extension upload...');

// Check environment variables
const zipPath = process.env.CHROME_ZIP_PATH;
const rolloutPercentage = process.env.ROLLOUT_PERCENTAGE || '1';
const extensionId = process.env.EXTENSION_ID || 'test-extension-id';

console.log('📋 Configuration:');
console.log(`  - ZIP Path: ${zipPath || 'Not specified'}`);
console.log(`  - Rollout: ${rolloutPercentage}%`);
console.log(`  - Extension ID: ${extensionId}`);

// Verify build artifact exists (when path is provided)
if (zipPath) {
  const absolutePath = resolve(zipPath);
  if (existsSync(absolutePath)) {
    console.log(`✅ Build artifact found at: ${absolutePath}`);
    // TODO: Add file size check
    const stats = require('fs').statSync(absolutePath);
    console.log(`  - File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.error(`❌ Build artifact not found at: ${absolutePath}`);
    process.exit(1);
  }
}

// Simulate upload process
console.log('📤 Uploading extension to Chrome Web Store...');
console.log('  - This is a test run - no actual upload performed');

// TODO: When ready for production, uncomment:
// const chromeWebStore = new ChromeWebStore({
//   clientId: process.env.CWS_CLIENT_ID,
//   clientSecret: process.env.CWS_CLIENT_SECRET,
//   refreshToken: process.env.CWS_REFRESH_TOKEN,
// });
// const result = await chromeWebStore.uploadExisting(zipContent, extensionId);
// await chromeWebStore.publish('default', rolloutPercentage);

console.log('✅ Upload completed successfully!');
