/* eslint-disable no-var */
/**
 * Passkey popup – performs WebAuthn create / sign operations in a dedicated
 * browser window so that navigator.credentials is available regardless of the
 * calling context (service worker, side panel, offscreen document).
 *
 * URL parameters:
 *   action      – 'create' or 'sign'
 *   operationId – unique id used to correlate the chrome.runtime result message
 *   rpName      – (create) relying party display name
 *   verifierId  – (sign) base64url public key identifying the passkey
 */

/* ── helpers ─────────────────────────────────────────────── */

function b64url(buf) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function b64urlDecode(str) {
  var b = str.replace(/-/g, '+').replace(/_/g, '/');
  var pad = '='.repeat((4 - (b.length % 4)) % 4);
  var bin = atob(b + pad);
  var arr = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}

function tsChallenge(ms) {
  var buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(ms));
  return new Uint8Array(buf);
}

/* ── webauthn operations ─────────────────────────────────── */

async function doCreate(rpName) {
  var challenge = crypto.getRandomValues(new Uint8Array(32));
  var cred = await navigator.credentials.create({
    publicKey: {
      challenge: challenge,
      rp: { name: rpName || 'MetaMask MPC Wallet' },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: 'mpc-wallet-user',
        displayName: 'MPC Wallet User',
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
      timeout: 60000,
    },
  });

  var resp = cred.response;
  var pk = resp.getPublicKey();
  if (!pk) {
    throw new Error('Failed to extract public key');
  }

  var credentialId = b64url(cred.rawId);
  var publicKey = b64url(pk);

  // Persist credential ID so sign() can find it later.
  localStorage.setItem('mpc-passkey:' + publicKey, credentialId);

  return { credentialId: credentialId, publicKey: publicKey };
}

async function doSign(verifierId) {
  var credentialId = localStorage.getItem('mpc-passkey:' + verifierId);
  if (!credentialId) {
    throw new Error(
      'No passkey credential found for verifier ' + verifierId,
    );
  }

  var now = Date.now();
  var assertion = await navigator.credentials.get({
    publicKey: {
      challenge: tsChallenge(now),
      allowCredentials: [
        { type: 'public-key', id: b64urlDecode(credentialId) },
      ],
      userVerification: 'required',
      timeout: 60000,
    },
  });

  var resp = assertion.response;
  return JSON.stringify({
    credentialId: b64url(assertion.rawId),
    authenticatorData: b64url(resp.authenticatorData),
    clientDataJSON: b64url(resp.clientDataJSON),
    signature: b64url(resp.signature),
    timestamp: now,
  });
}

/* ── main flow ───────────────────────────────────────────── */

var params = new URLSearchParams(location.search);
var action = params.get('action');
var operationId = params.get('operationId');
var verifierId = params.get('verifierId');
var rpName = params.get('rpName');

function sendResult(success, payload, errorMsg) {
  chrome.runtime.sendMessage({
    type: 'passkey-result',
    operationId: operationId,
    success: success,
    payload: payload,
    error: errorMsg,
  });
}

async function execute() {
  try {
    var result;
    if (action === 'create') {
      result = await doCreate(rpName);
    } else if (action === 'sign') {
      result = await doSign(verifierId);
    } else {
      throw new Error('Unknown passkey action: ' + action);
    }
    sendResult(true, result, null);
    window.close();
  } catch (err) {
    console.error('[passkey-popup] WebAuthn error:', err);
    document.getElementById('spinner').style.display = 'none';
    document.getElementById('status').textContent = 'Authentication failed.';
    document.getElementById('error').textContent =
      (err.name ? err.name + ': ' : '') + (err.message || String(err));

    // Let the user retry for transient errors (e.g. cancelled prompt).
    if (err && err.name === 'NotAllowedError') {
      document.getElementById('retryBtn').style.display = 'inline-block';
      return;
    }

    sendResult(false, null, err.message || String(err));
    setTimeout(function () {
      window.close();
    }, 5000);
  }
}

// Button click provides user activation required by WebAuthn.
document.getElementById('retryBtn').addEventListener('click', function () {
  document.getElementById('retryBtn').style.display = 'none';
  document.getElementById('spinner').style.display = 'block';
  document.getElementById('status').textContent =
    'Complete the biometric prompt\u2026';
  document.getElementById('error').textContent = '';
  execute();
});

// Auto-trigger: try without user activation first.
// If Chrome blocks it (NotAllowedError), the button becomes visible.
document.getElementById('retryBtn').style.display = 'none';
document.getElementById('spinner').style.display = 'block';
document.getElementById('status').textContent =
  'Complete the biometric prompt\u2026';
execute();
