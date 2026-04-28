#!/usr/bin/env node
// bootstrap-fixture.cjs — Build a wallet-fixture.json from a password + SRP.
//
// Usage:
//   node test/agentic/setup/bootstrap-fixture.cjs \
//     --password 'pass' \
//     --srp 'word1 word2 ... word12' \
//     --out temp/runtime/wallet-fixture.json
//
// Or read from stdin (JSON: { password, srp, name? }):
//   echo '{"password":"...","srp":"..."}' | node bootstrap-fixture.cjs --out fixture.json
//
// Use only with testnet seeds. Never paste a mainnet SRP into a fixture file.
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--password') opts.password = args[++i];
  else if (a === '--srp') opts.srp = args[++i];
  else if (a === '--name') opts.name = args[++i];
  else if (a === '--out') opts.out = args[++i];
  else if (a === '--stdin') opts.stdin = true;
  else if (a === '-h' || a === '--help') {
    console.log('Usage: bootstrap-fixture.cjs --password <p> --srp "<words>" --out <path> [--name <n>]');
    process.exit(0);
  }
}

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
  });
}

(async () => {
  if (opts.stdin || (!opts.password && !opts.srp)) {
    const raw = await readStdin();
    if (raw.trim()) {
      const parsed = JSON.parse(raw);
      opts.password = opts.password || parsed.password;
      opts.srp = opts.srp || parsed.srp;
      opts.name = opts.name || parsed.name;
    }
  }
  if (!opts.password || !opts.srp || !opts.out) {
    console.error('FAIL: --password, --srp, --out are required (or pipe JSON via stdin)');
    process.exit(1);
  }

  const resolveDep = (mod) =>
    require(require.resolve(mod, { paths: [process.cwd()] }));

  const enc = resolveDep('@metamask/browser-passworder');
  const { HdKeyring } = resolveDep('@metamask/eth-hd-keyring');

  const keyring = new HdKeyring();
  await keyring.deserialize({
    mnemonic: opts.srp.trim(),
    numberOfAccounts: 1,
    hdPath: "m/44'/60'/0'/0",
  });
  const accounts = await keyring.getAccounts();
  const address = accounts[0];
  const serialized = await keyring.serialize();

  const keyrings = [{ type: 'HD Key Tree', data: serialized }];
  const vault = await enc.encrypt(opts.password, keyrings);

  const fixture = {
    password: opts.password,
    address,
    name: opts.name || 'agentic-dev',
    vault,
    accounts: [],
    settings: { autoLockNever: true, injectImportedAccounts: false },
  };

  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify(fixture, null, 2));
  console.log(`[bootstrap] Wrote ${opts.out}`);
  console.log(`  Address: ${address}`);
  console.log(`  Vault:   ${vault.length} chars`);
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
