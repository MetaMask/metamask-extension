#!/usr/bin/env node
/**
 * Designer Mode Wait CLI
 *
 * Blocks until the designer sends a request via the Designer Mode panel,
 * then prints a structured prompt to stdout and exits.
 *
 * Designed to be called in a loop by any AI agent:
 *   1. Agent runs: yarn designer-wait
 *   2. Blocks until the designer sends a message
 *   3. Prints the structured request to stdout
 *   4. Agent reads it, applies the changes, then runs designer-wait again
 *
 * Usage:
 *   yarn designer-wait
 *
 * Environment:
 *   DESIGNER_PORT  — port of the designer server (default: 3334)
 *   DESIGNER_HOST  — host of the designer server (default: localhost)
 */

'use strict';

const http = require('http');

const PORT = parseInt(process.env.DESIGNER_PORT || '3334', 10);
const HOST = process.env.DESIGNER_HOST || 'localhost';

/**
 * Long-poll the designer server. Retries automatically on timeout (204).
 * @returns {Promise<string>} The designer's request as a formatted prompt.
 */
function waitForMessage() {
  return new Promise((resolve, reject) => {
    const req = http.get(
      `http://${HOST}:${PORT}/api/wait`,
      { timeout: 310000 },
      (res) => {
        if (res.statusCode === 204) {
          // Server timed out, silently retry
          process.stderr.write('.');
          resolve(waitForMessage());
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Unexpected status: ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      },
    );
    req.on('error', reject);
  });
}

async function main() {
  // Status messages go to stderr so they don't pollute the prompt on stdout
  process.stderr.write(
    `\n🎨 Designer Mode — waiting for request (http://${HOST}:${PORT})...\n\n`,
  );

  try {
    const message = await waitForMessage();

    // The structured prompt goes to stdout — this is what the agent reads
    process.stdout.write(message);
    process.stdout.write('\n');
    process.exit(0);
  } catch (error) {
    process.stderr.write(`\n❌ Could not connect to Designer Mode server.\n`);
    process.stderr.write(
      `   Make sure it is running: yarn designer-server\n\n`,
    );
    process.stderr.write(`   Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
