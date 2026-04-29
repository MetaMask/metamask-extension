#!/usr/bin/env node
// generate-fixture.cjs — Build fixture-state.json from a wallet-fixture.json.
//
// Reads `test/e2e/fixtures/default-fixture.json` (post-migration baseline) and
// patches the fields that differ from a clean install: vault, accounts,
// onboarding flag, network selection, perps controller flags. Writes the
// result so the launcher can prefill chrome.storage.local before the SW boots.
//
// Wallet fixture shape (edit-friendly — copy from
// test/agentic/wallet-fixture.example.json and fill in):
//   {
//     "password": "...",
//     "srp": "twelve word seed phrase here ...",
//     "name": "agentic-dev"            // optional — account label
//     "accounts": [                    // optional — extra imported accounts
//       { "type": "privateKey", "value": "0x...", "name": "..." }
//     ],
//     "settings": { "autoLockNever": true, "injectImportedAccounts": false }
//   }
//
// Backward-compat: if "vault" is set, it is decrypted instead of building a new
// one from "srp" — same shape farmslot has historically used.
//
// Usage: node generate-fixture.cjs <wallet-fixture.json> <output.json>
'use strict';

const fs = require('fs');
const path = require('path');

const [walletPath, outputPath] = process.argv.slice(2);
if (!walletPath || !outputPath) {
  console.error('Usage: node generate-fixture.cjs <wallet-fixture> <output>');
  process.exit(1);
}

const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
if (!wallet.password) {
  console.error('FAIL: wallet fixture missing "password"');
  process.exit(1);
}
if (!wallet.vault && !wallet.srp) {
  console.error('FAIL: wallet fixture must include either "srp" (12 word seed) or "vault"');
  process.exit(1);
}

const accountName = wallet.name || 'agentic-dev';
const injectImported = wallet.settings?.injectImportedAccounts === true;
const pkAccounts = injectImported
  ? (wallet.accounts || []).filter((a) => a.type === 'privateKey')
  : [];

const fixturePath = path.join(process.cwd(), 'test/e2e/fixtures/default-fixture.json');
if (!fs.existsSync(fixturePath)) {
  console.error('FAIL: default-fixture.json not found at', fixturePath);
  console.error('  Run from extension repo root.');
  process.exit(1);
}
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const data = fixture.data;

const resolveDep = (mod) =>
  require(require.resolve(mod, { paths: [process.cwd()] }));

function privateKeyToAddress(hexKey) {
  const { privateToAddress, bytesToHex } = resolveDep('@ethereumjs/util');
  return bytesToHex(privateToAddress(Buffer.from(hexKey, 'hex')));
}

(async () => {
  const enc = resolveDep('@metamask/browser-passworder');
  let keyrings;
  let primaryAddress = wallet.address;

  if (wallet.vault) {
    keyrings = await enc.decrypt(wallet.password, wallet.vault);
    if (!primaryAddress) {
      // Best-effort: derive from the HD keyring if present.
      const hd = keyrings.find((k) => k.type === 'HD Key Tree');
      if (hd) {
        const { HdKeyring } = resolveDep('@metamask/eth-hd-keyring');
        const ring = new HdKeyring();
        await ring.deserialize(hd.data);
        const accts = await ring.getAccounts();
        primaryAddress = accts[0];
      }
    }
  } else {
    const { HdKeyring } = resolveDep('@metamask/eth-hd-keyring');
    const ring = new HdKeyring();
    await ring.deserialize({
      mnemonic: wallet.srp.trim(),
      numberOfAccounts: 1,
      hdPath: "m/44'/60'/0'/0",
    });
    const accts = await ring.getAccounts();
    primaryAddress = primaryAddress || accts[0];
    keyrings = [{ type: 'HD Key Tree', data: await ring.serialize() }];
  }

  if (!primaryAddress) {
    console.error('FAIL: could not determine primary account address');
    process.exit(1);
  }

  for (const acct of pkAccounts) {
    const raw = acct.value.startsWith('0x') ? acct.value.slice(2) : acct.value;
    keyrings.push({ type: 'Simple Key Pair', data: [raw] });
  }
  data.KeyringController = { vault: await enc.encrypt(wallet.password, keyrings) };
  console.log(`[fixture] Vault: ${keyrings.length} keyring(s) (1 HD + ${pkAccounts.length} imported) → ${primaryAddress}`);

  const accts = data.AccountsController?.internalAccounts;
  if (accts) {
    const hdEntry = Object.entries(accts.accounts).find(
      ([, a]) => a.metadata?.keyring?.type === 'HD Key Tree',
    );
    if (hdEntry) {
      const [hdId, hdAcct] = hdEntry;
      hdAcct.address = primaryAddress;
      if (hdAcct.metadata) hdAcct.metadata.name = accountName;
      accts.selectedAccount = hdId;
    }
    for (const acct of pkAccounts) {
      const raw = acct.value.startsWith('0x') ? acct.value.slice(2) : acct.value;
      const address = privateKeyToAddress(raw);
      const id = require('crypto').randomUUID();
      accts.accounts[id] = {
        address,
        id,
        metadata: {
          name: acct.name || '',
          importTime: Date.now(),
          keyring: { type: 'Simple Key Pair' },
          lastSelected: 0,
        },
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      };
      console.log(`[fixture] Imported: ${acct.name || '(unnamed)'} → ${address}`);
    }
  }

  if (data.AccountTracker?.accountsByChainId) {
    for (const chainId of Object.keys(data.AccountTracker.accountsByChainId)) {
      const chain = data.AccountTracker.accountsByChainId[chainId];
      for (const oldAddr of Object.keys(chain)) {
        if (oldAddr.toLowerCase() !== primaryAddress.toLowerCase()) {
          chain[primaryAddress] = { balance: '0x0' };
          delete chain[oldAddr];
        }
      }
    }
  }

  data.OnboardingController = {
    completedOnboarding: true,
    firstTimeFlowType: 'import',
    seedPhraseBackedUp: true,
  };

  if (!data.PreferencesController) data.PreferencesController = {};
  data.PreferencesController.useExternalServices = true;
  if (!data.PreferencesController.preferences) data.PreferencesController.preferences = {};
  data.PreferencesController.preferences.useSidePanelAsDefault = true;
  if (wallet.settings?.autoLockNever) {
    data.PreferencesController.autoLockTimeLimit = 0;
  }

  // Default fixture's localhost (0x539) + sepolia (0xaa36a7) confuse network state.
  // Strip them and select mainnet.
  if (data.NetworkController) {
    data.NetworkController.selectedNetworkClientId = 'mainnet';
    const configs = data.NetworkController.networkConfigurationsByChainId || {};
    delete configs['0x539'];
    delete configs['0xaa36a7'];
    const meta = data.NetworkController.networksMetadata || {};
    for (const clientId of Object.keys(meta)) {
      if (clientId.includes('localhost') || clientId === 'sepolia') {
        delete meta[clientId];
      }
    }
  }

  // Without this, removed localhost leaves no enabled networks and MetaMask
  // falls back to "All popular networks" which stalls the home screen.
  if (data.NetworkEnablementController?.enabledNetworkMap?.eip155) {
    const eip155 = data.NetworkEnablementController.enabledNetworkMap.eip155;
    for (const key of Object.keys(eip155)) eip155[key] = false;
    eip155['0x1'] = true;
  }

  data.PerpsController = data.PerpsController || {};
  data.PerpsController.isFirstTimeUser = { mainnet: false, testnet: false };
  data.PerpsController.hasPlacedFirstOrder = { mainnet: true, testnet: true };

  fs.writeFileSync(outputPath, JSON.stringify(fixture));
  console.log(`[fixture] Wrote ${Object.keys(data).length} controllers → ${outputPath}`);
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
