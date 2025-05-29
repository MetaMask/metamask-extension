#!/usr/bin/env tsx

import { existsSync } from 'fs';
import { resolve } from 'path';

console.log('🚀 Starting Firefox extension upload...');

// Check environment variables
const xpiPath = process.env.FIREFOX_XPI_PATH;
const addonId = process.env.ADDON_ID || 'test-addon-id';

console.log('📋 Configuration:');
console.log(`  - XPI Path: ${xpiPath || 'Not specified'}`);
console.log(`  - Add-on ID: ${addonId}`);

// Verify build artifact exists (when path is provided)
if (xpiPath) {
  const absolutePath = resolve(xpiPath);
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
console.log('📤 Uploading extension to Firefox Add-ons...');
console.log('  - This is a test run - no actual upload performed');

// TODO: When ready for production, uncomment:
// const signAddon = require('sign-addon').default;
// const result = await signAddon({
//   xpiPath: xpiPath,
//   version: 'listed',
//   apiKey: process.env.AMO_JWT_ISSUER,
//   apiSecret: process.env.AMO_JWT_SECRET,
//   id: addonId,
// });

console.log('✅ Upload completed successfully!');
