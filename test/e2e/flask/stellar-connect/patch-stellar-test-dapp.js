/**
 * Patches the bundled Stellar test dapp so E2E network-change tests can pass.
 * connect-stellar 0.2.0 is pubnet-only; this adds testnet scope handling
 * and syncs the dapp network select when the wallet scope changes.
 */
const fs = require('fs');
const path = require('path');

const TEST_DAPP_ASSETS_DIR = path.join(
  __dirname,
  '../../../../node_modules/@metamask/test-dapp-stellar/dist/assets',
);

const PATCHES = [
  {
    from: 'var Ru;(function(i){i.PUBNET="stellar:pubnet"})(Ru||(Ru={}));',
    to: 'var Ru;(function(i){i.PUBNET="stellar:pubnet",i.TESTNET="stellar:testnet"})(Ru||(Ru={}));',
  },
  {
    from: 'kf={[Ru.PUBNET]:"Public Global Stellar Network ; September 2015"},am={[Ru.PUBNET]:"PUBLIC"}',
    to: 'kf={[Ru.PUBNET]:"Public Global Stellar Network ; September 2015",[Ru.TESTNET]:"Test SDF Network ; September 2015"},am={[Ru.PUBNET]:"PUBLIC",[Ru.TESTNET]:"TESTNET"}',
  },
  {
    from: 'selectScopeWithPriority(o,s){return new Set(Object.keys((o==null?void 0:o.sessionScopes)??{})).has(Ru.PUBNET)?Ru.PUBNET:void 0}',
    to: 'selectScopeWithPriority(o,s){const k=new Set(Object.keys((o==null?void 0:o.sessionScopes)??{}));const S=[...k].filter(x=>x.startsWith("stellar:"));if(S.length===1)return S[0];if(s&&k.has(s))return s;if(k.has(Ru.TESTNET))return Ru.TESTNET;if(k.has(Ru.PUBNET))return Ru.PUBNET;return void 0}',
  },
  {
    from: 'selectScopeWithPriority(o,s){const k=new Set(Object.keys((o==null?void 0:o.sessionScopes)??{}));if(s&&k.has(s))return s;if(k.has(Ru.TESTNET))return Ru.TESTNET;if(k.has(Ru.PUBNET))return Ru.PUBNET;return void 0}',
    to: 'selectScopeWithPriority(o,s){const k=new Set(Object.keys((o==null?void 0:o.sessionScopes)??{}));const S=[...k].filter(x=>x.startsWith("stellar:"));if(S.length===1)return S[0];if(s&&k.has(s))return s;if(k.has(Ru.TESTNET))return Ru.TESTNET;if(k.has(Ru.PUBNET))return Ru.PUBNET;return void 0}',
  },
  {
    from: 'setScope(o){if(this._scope!==o){try{localStorage.setItem("metamaskStellarAdapterScope",o)}catch{}this._scope=o,this.emit("networkChanged",{network:am[o],networkPassphrase:kf[o]})}}',
    to: 'setScope(o){if(this._scope!==o){try{localStorage.setItem("metamaskStellarAdapterScope",o)}catch{}this._scope=o,this.emit("networkChanged",{network:am[o],networkPassphrase:kf[o]});try{const n=o===Ru.TESTNET?"testnet":"pubnet",G=document.querySelector(\'[data-testid="testpage.header.network"]\');G&&(G.value=n,G.dispatchEvent(new Event("change",{bubbles:!0})),localStorage.setItem("stellar.selectedNetwork",n))}catch{}}}',
  },
];

function patchStellarTestDappBundle() {
  if (!fs.existsSync(TEST_DAPP_ASSETS_DIR)) {
    throw new Error(
      `Stellar test dapp assets not found at ${TEST_DAPP_ASSETS_DIR}`,
    );
  }

  const bundleFiles = fs
    .readdirSync(TEST_DAPP_ASSETS_DIR)
    .filter((file) => file.startsWith('index-') && file.endsWith('.js'));

  if (bundleFiles.length === 0) {
    throw new Error('No Stellar test dapp bundle file found to patch');
  }

  for (const bundleFile of bundleFiles) {
    const bundlePath = path.join(TEST_DAPP_ASSETS_DIR, bundleFile);
    let contents = fs.readFileSync(bundlePath, 'utf8');
    let patched = false;

    for (const { from, to } of PATCHES) {
      if (contents.includes(from)) {
        contents = contents.replace(from, to);
        patched = true;
      }
    }

    if (patched) {
      fs.writeFileSync(bundlePath, contents);
      console.log(`Patched Stellar test dapp bundle: ${bundleFile}`);
    }
  }
}

patchStellarTestDappBundle();
