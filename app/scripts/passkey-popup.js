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

/* ── DOM refs ────────────────────────────────────────────── */

var iconRing = document.getElementById('iconRing');
var iconFingerprint = document.getElementById('iconFingerprint');
var iconSpinner = document.getElementById('iconSpinner');
var iconSuccess = document.getElementById('iconSuccess');
var iconError = document.getElementById('iconError');
var titleEl = document.getElementById('title');
var subtitleEl = document.getElementById('subtitle');
var authBtn = document.getElementById('authBtn');
var errorEl = document.getElementById('error');

/* ── UI state management ─────────────────────────────────── */

function showState(state, opts) {
  opts = opts || {};

  // Reset all icons
  iconFingerprint.classList.add('hidden');
  iconSpinner.classList.add('hidden');
  iconSuccess.classList.add('hidden');
  iconError.classList.add('hidden');

  // Reset ring color
  iconRing.className = 'icon-ring';

  // Reset button
  authBtn.classList.remove('hidden');

  switch (state) {
    case 'ready':
      iconFingerprint.classList.remove('hidden');
      titleEl.textContent = 'Verify your identity';
      subtitleEl.textContent =
        'MetaMask needs to confirm it\u2019s you before continuing.';
      authBtn.classList.remove('hidden');
      break;

    case 'authenticating':
      iconRing.classList.add('active');
      iconSpinner.classList.remove('hidden');
      titleEl.textContent = 'Authenticating\u2026';
      subtitleEl.textContent = 'Complete the prompt from your device.';
      authBtn.classList.add('hidden');
      break;

    case 'success':
      iconRing.classList.add('success');
      iconSuccess.classList.remove('hidden');
      titleEl.textContent = 'Verified';
      subtitleEl.textContent = opts.message || 'You\u2019re all set. This window will close.';
      authBtn.classList.add('hidden');
      break;

    case 'error':
      iconRing.classList.add('error');
      iconError.classList.remove('hidden');
      titleEl.textContent = 'Authentication failed';
      subtitleEl.textContent = 'Something went wrong. You can try again.';
      errorEl.textContent = opts.message || '';
      break;
  }
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
  showState('authenticating');
  errorEl.textContent = '';

  try {
    var result;
    if (action === 'create') {
      result = await doCreate(rpName);
    } else if (action === 'sign') {
      result = await doSign(verifierId);
    } else {
      throw new Error('Unknown passkey action: ' + action);
    }

    showState('success');
    sendResult(true, result, null);
    setTimeout(function () {
      window.close();
    }, 800);
  } catch (err) {
    console.error('[passkey-popup] WebAuthn error:', err);

    var message = (err.name ? err.name + ': ' : '') + (err.message || String(err));

    // Let the user retry for transient errors (e.g. cancelled prompt).
    if (err && err.name === 'NotAllowedError') {
      showState('error', { message: 'Cancelled or not allowed. Tap to retry.' });
      return;
    }

    showState('error', { message: message });
    sendResult(false, null, err.message || String(err));
    setTimeout(function () {
      window.close();
    }, 5000);
  }
}

// Button click provides user activation required by WebAuthn.
authBtn.addEventListener('click', function () {
  execute();
});

// Auto-trigger: try without user activation first.
// If Chrome blocks it (NotAllowedError), the button becomes visible.
showState('authenticating');
execute();
