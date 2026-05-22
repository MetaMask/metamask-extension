import { EventEmitter } from 'eventemitter3';
import { HARDENED_OFFSET } from '@gridplus/types';

// src/keyring.ts

// src/api-client.ts
var DEFAULT_TIMEOUT = 12e4;
var SESSION_KEY_HEADER = "x-gridplus-session-key";
var ConnectApiError = class extends Error {
  status;
  code;
  constructor(message, status, code) {
    super(message);
    this.name = "ConnectApiError";
    this.status = status;
    this.code = code;
  }
};
var ConnectApiClient = class _ConnectApiClient {
  baseUrl;
  sessionKey;
  timeout;
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.sessionKey = config.sessionKey;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }
  getSessionKey() {
    return this.sessionKey;
  }
  setSessionKey(sessionKey) {
    this.sessionKey = sessionKey;
  }
  /**
   * Extracts an error message/code from the Connect API response body.
   */
  static extractErrorDetails(errorBody, status) {
    const candidate = errorBody;
    const message = typeof candidate.error?.message === "string" ? candidate.error.message : typeof candidate.message === "string" ? candidate.message : `Request failed with status ${status}`;
    const code = typeof candidate.error?.code === "string" ? candidate.error.code : typeof candidate.code === "string" ? candidate.code : void 0;
    return { message, code };
  }
  /**
   * Appends query params to a path, skipping undefined values.
   */
  static withQuery(path, params) {
    if (!params) return path;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === void 0) continue;
      query.set(key, String(value));
    }
    const queryString = query.toString();
    return queryString ? `${path}?${queryString}` : path;
  }
  /**
   * Makes a request to the Connect API and returns the raw Response.
   * Errors are normalized to ConnectApiError.
   */
  async requestRaw(method, path, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          [SESSION_KEY_HEADER]: this.sessionKey
        },
        credentials: "include",
        body: body ? JSON.stringify(body) : void 0,
        signal: controller.signal
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const { message, code } = _ConnectApiClient.extractErrorDetails(errorBody, response.status);
        throw new ConnectApiError(message, response.status, code);
      }
      return response;
    } catch (error) {
      if (error instanceof ConnectApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new ConnectApiError("Request timed out", 408);
      }
      throw new ConnectApiError(error instanceof Error ? error.message : "Unknown error", 0);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  async requestJsonOrNull(method, path, body) {
    const response = await this.requestRaw(method, path, body);
    if (response.status === 204) return null;
    return await response.json();
  }
  async requestJson(method, path, body) {
    const response = await this.requestRaw(method, path, body);
    if (response.status === 204) {
      throw new ConnectApiError("Unexpected empty response", 204);
    }
    return await response.json();
  }
  /**
   * Gets the current session info.
   */
  async getSession() {
    return this.requestJsonOrNull("GET", "/api/v1/device/session");
  }
  /**
   * Derives addresses for the given device and path.
   */
  async deriveAddresses(deviceId, startPath, count, iterIdx) {
    const body = {
      startPath,
      count
    };
    if (iterIdx !== void 0) {
      body.iterIdx = iterIdx;
    }
    return this.requestJson("POST", `/api/v1/derive/${encodeURIComponent(deviceId)}`, body);
  }
  /**
   * Calls a method on the device (e.g., signing).
   */
  async callMethod(deviceId, request) {
    return this.requestJson("POST", `/api/v1/device/${encodeURIComponent(deviceId)}/method`, request);
  }
  /**
   * Signs a transaction via the Connect API.
   */
  async signTransaction(deviceId, tx, chainId, signerPath) {
    return this.callMethod(deviceId, {
      method: "eth_signTransaction",
      params: [tx],
      chainId,
      signerPath
    });
  }
  /**
   * Signs a personal message via the Connect API.
   */
  async signPersonalMessage(deviceId, message, address, chainId, signerPath) {
    const request = {
      method: "personal_sign",
      params: [message, address],
      signerPath
    };
    if (chainId) request.chainId = chainId;
    return this.callMethod(deviceId, request);
  }
  /**
   * Signs typed data (EIP-712) via the Connect API.
   */
  async signTypedData(deviceId, address, typedData, chainId, signerPath) {
    const request = {
      method: "eth_signTypedData_v4",
      params: [address, typedData],
      signerPath
    };
    if (chainId) request.chainId = chainId;
    return this.callMethod(deviceId, request);
  }
  /**
   * Fetches Solana accounts for the active device.
   */
  async solanaAccounts(deviceId) {
    return this.callMethod(deviceId, {
      method: "solana_accounts",
      params: []
    });
  }
  /**
   * Signs a Solana message.
   */
  async solanaSignMessage(deviceId, payload) {
    return this.callMethod(deviceId, {
      method: "solana_signMessage",
      params: [payload]
    });
  }
  /**
   * Signs a Solana transaction.
   */
  async solanaSignTransaction(deviceId, payload) {
    return this.callMethod(deviceId, {
      method: "solana_signTransaction",
      params: [payload]
    });
  }
  /**
   * Signs multiple Solana transactions.
   */
  async solanaSignAllTransactions(deviceId, payload) {
    return this.callMethod(deviceId, {
      method: "solana_signAllTransactions",
      params: [payload]
    });
  }
  /**
   * Signs and sends a Solana transaction.
   */
  async solanaSignAndSendTransaction(deviceId, payload, chainId) {
    return this.callMethod(deviceId, {
      method: "solana_signAndSendTransaction",
      params: [payload],
      chainId
    });
  }
  /**
   * Signs a Cosmos payload.
   * Firmware auto-detects whether the payload is Direct or Amino.
   */
  async cosmosSign(deviceId, payload, signerPath) {
    const request = {
      method: "cosmos_sign",
      params: [payload]
    };
    if (signerPath) request.signerPath = signerPath;
    return this.callMethod(deviceId, request);
  }
  /**
   * Syncs Bitcoin wallet state for the active device.
   */
  async btcSync(deviceId, payload = {}) {
    return this.requestJson("POST", `/api/v1/bitcoin/${encodeURIComponent(deviceId)}/sync`, payload);
  }
  /**
   * Fetches Bitcoin summary balances.
   */
  async btcSummary(deviceId, params = {}) {
    return this.requestJson("GET", _ConnectApiClient.withQuery(`/api/v1/bitcoin/${encodeURIComponent(deviceId)}/summary`, { purpose: params.purpose, network: params.network }));
  }
  /**
   * Fetches Bitcoin transactions for the active device.
   */
  async btcTransactions(deviceId, params = {}) {
    return this.requestJson(
      "GET",
      _ConnectApiClient.withQuery(`/api/v1/bitcoin/${encodeURIComponent(deviceId)}/transactions`, {
        purpose: params.purpose,
        network: params.network,
        page: params.page,
        pageSize: params.pageSize
      })
    );
  }
  /**
   * Sends a Bitcoin transaction.
   */
  async btcSend(deviceId, payload) {
    return this.requestJson("POST", `/api/v1/bitcoin/${encodeURIComponent(deviceId)}/send`, payload);
  }
  /**
   * Fetches a Bitcoin extended public key.
   */
  async btcXpub(deviceId, params = {}) {
    return this.requestJson("GET", _ConnectApiClient.withQuery(`/api/v1/bitcoin/${encodeURIComponent(deviceId)}/xpub`, { purpose: params.purpose, network: params.network }));
  }
  /**
   * Persists the selected Bitcoin wallet purpose.
   */
  async btcSetPurpose(deviceId, payload) {
    return this.requestJson("PUT", `/api/v1/bitcoin/${encodeURIComponent(deviceId)}/purpose`, payload);
  }
  /**
   * Queries the portfolio API for one or many devices.
   */
  async portfolioQuery(payload) {
    return this.requestJson("POST", "/api/v1/portfolio/query", payload);
  }
  /**
   * Forces a refresh for the requested portfolio scope.
   */
  async portfolioRefresh(payload) {
    return this.requestJson("POST", "/api/v1/portfolio/refresh", payload);
  }
  /**
   * Logout / clear session.
   */
  async logout() {
    await this.requestJson("POST", "/api/v1/device/logout");
  }
};
function parseHdPath(hdPath, insertIdx = 0) {
  const raw = hdPath.trim();
  if (!raw.startsWith("m/")) {
    throw new Error('Invalid HD path: must start with "m/"');
  }
  const segments = raw.split("/").slice(1);
  const indices = [];
  let usedX = false;
  for (const segment of segments) {
    if (!segment) {
      throw new Error("Invalid HD path: empty segment");
    }
    const isHardened = segment.endsWith("'");
    const normalized = isHardened ? segment.slice(0, -1) : segment;
    const idx = (() => {
      if (normalized === "x") {
        usedX = true;
        return insertIdx + (isHardened ? HARDENED_OFFSET : 0);
      }
      if (!/^\d+$/.test(normalized)) {
        throw new Error(`Invalid HD path segment: ${segment}`);
      }
      const parsed = Number.parseInt(normalized, 10);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid HD path segment: ${segment}`);
      }
      return parsed + (isHardened ? HARDENED_OFFSET : 0);
    })();
    indices.push(idx);
  }
  if (!usedX) {
    indices.push(insertIdx);
  }
  if (indices.length > 5) {
    throw new Error("HD paths with more than 5 indices are not supported");
  }
  if (!isValidSignerPath(indices)) {
    throw new Error("Invalid HD path: signer path is not valid");
  }
  return indices;
}
function findIterIdx(hdPath) {
  const raw = hdPath.trim();
  if (!raw.startsWith("m/")) {
    throw new Error('Invalid HD path: must start with "m/"');
  }
  const segments = raw.split("/").slice(1);
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment?.includes("x")) {
      return i === segments.length - 1 ? -1 : i;
    }
  }
  return -1;
}
function hasInternalVarIdx(hdPath) {
  return findIterIdx(hdPath) >= 0;
}
function getSignerPath(hdPath, accountIndex) {
  return parseHdPath(hdPath, accountIndex);
}
function formatSignerPath(signerPath) {
  const segments = signerPath.map((idx) => {
    if (idx >= HARDENED_OFFSET) {
      return `${idx - HARDENED_OFFSET}'`;
    }
    return idx.toString();
  });
  return `m/${segments.join("/")}`;
}
function isValidSignerPath(signerPath) {
  if (!Array.isArray(signerPath)) return false;
  if (signerPath.length < 2 || signerPath.length > 5) return false;
  for (const idx of signerPath) {
    if (typeof idx !== "number") return false;
    if (!Number.isInteger(idx)) return false;
    if (idx < 0 || idx > 4294967295) return false;
  }
  return true;
}

// src/types.ts
var PER_PAGE = 5;
var STANDARD_HD_PATH = `m/44'/60'/0'/0/x`;
var INTERNAL_VAR_HD_PATH = `m/44'/60'/x'/0/0`;
var LEGACY_HD_PATH = `m/44'/60'/0'/x`;

// src/keyring.ts
var KEYRING_TYPE = "Lattice Hardware";
var DEFAULT_API_BASE_URL = "https://api.gridplus.io";
var DEFAULT_CONNECT_PAGE_URL = "https://app.gridplus.io/connect";
var DEFAULT_SESSION_KEY = "metamask";
var DEFAULT_APP_NAME = "MetaMask";
function normalizeAddress(address) {
  const lower = address.toLowerCase();
  return lower.startsWith("0x") ? lower : `0x${lower}`;
}
var CONNECT_API_ERROR_CODES = {
  DEVICE_LOCKED: "device_locked",
  DEVICE_BUSY: "device_busy",
  PAIRING_REQUIRED: "pairing_required",
  FEATURE_DISABLED: "feature_disabled",
  USER_DECLINED: "user_declined",
  USER_TIMEOUT: "user_timeout",
  INVALID_EPHEMERAL_ID: "invalid_ephemeral_id",
  WRONG_WALLET: "wrong_wallet",
  SIGNER_PATH_MISMATCH: "signer_path_mismatch"
};
var isConnectApiErrorCode = (value) => {
  return typeof value === "string" && Object.values(CONNECT_API_ERROR_CODES).includes(value);
};
var isMissingSessionError = (error) => {
  if (error.status !== 401) return false;
  const normalizedMessage = error.message.trim().toLowerCase();
  return normalizedMessage === "missing session cookie" || normalizedMessage === "session required" || normalizedMessage === "invalid session token";
};
var isRecoverableSessionError = (error) => {
  const code = isConnectApiErrorCode(error.code) ? error.code : void 0;
  return code === CONNECT_API_ERROR_CODES.PAIRING_REQUIRED || code === CONNECT_API_ERROR_CODES.INVALID_EPHEMERAL_ID || error.status === 409 || error.status === 428 || isMissingSessionError(error);
};
var toHexChainId = (value) => {
  if (typeof value === "bigint") {
    return `0x${value.toString(16)}`;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return void 0;
    return `0x${BigInt(value).toString(16)}`;
  }
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return void 0;
    try {
      return `0x${BigInt(raw).toString(16)}`;
    } catch {
      return void 0;
    }
  }
  return void 0;
};
var extractTypedDataChainId = (typedData) => {
  const parsed = (() => {
    if (typeof typedData !== "string") return typedData;
    try {
      return JSON.parse(typedData);
    } catch {
      return void 0;
    }
  })();
  if (!parsed || typeof parsed !== "object") return void 0;
  const candidate = parsed;
  if (!candidate.domain || typeof candidate.domain !== "object") return void 0;
  const domain = candidate.domain;
  return toHexChainId(domain.chainId);
};
var GridPlusKeyring = class extends EventEmitter {
  static type = KEYRING_TYPE;
  type = KEYRING_TYPE;
  // State (serialized)
  deviceId = null;
  deviceType = null;
  sessionKey = DEFAULT_SESSION_KEY;
  hdPath = STANDARD_HD_PATH;
  page = 0;
  nextAccountIndex = 0;
  accounts = [];
  appName = DEFAULT_APP_NAME;
  // Runtime (not serialized)
  apiClient = null;
  openConnect = null;
  connectPageUrl;
  handleConnectApiError(error) {
    const code = isConnectApiErrorCode(error.code) ? error.code : void 0;
    if (isRecoverableSessionError(error)) {
      this.deviceId = null;
      throw new Error("Device session expired. Please reconnect.", { cause: error });
    }
    if (code === CONNECT_API_ERROR_CODES.WRONG_WALLET || code === CONNECT_API_ERROR_CODES.SIGNER_PATH_MISMATCH) {
      throw new Error("Active wallet mismatch. Switch the active wallet on your Lattice and try again.", { cause: error });
    }
    if (code === CONNECT_API_ERROR_CODES.DEVICE_LOCKED) {
      throw new Error("Device is locked. Unlock it on your Lattice, then try again.", { cause: error });
    }
    if (code === CONNECT_API_ERROR_CODES.DEVICE_BUSY) {
      throw new Error("Device is busy. Please wait and try again.", { cause: error });
    }
    if (code === CONNECT_API_ERROR_CODES.FEATURE_DISABLED) {
      throw new Error("This feature is disabled on the device.", { cause: error });
    }
    if (code === CONNECT_API_ERROR_CODES.USER_DECLINED) {
      throw new Error("Request was declined on the device.", { cause: error });
    }
    if (code === CONNECT_API_ERROR_CODES.USER_TIMEOUT) {
      throw new Error("Request timed out waiting for device response.", { cause: error });
    }
    throw error;
  }
  async executeWithReconnect(fn) {
    try {
      return await fn();
    } catch (error) {
      if (!(error instanceof ConnectApiError)) {
        throw error;
      }
      if (!isRecoverableSessionError(error) || !this.openConnect) {
        this.handleConnectApiError(error);
      }
      this.deviceId = null;
      await this.unlock();
      try {
        return await fn();
      } catch (retryError) {
        if (retryError instanceof ConnectApiError) {
          this.handleConnectApiError(retryError);
        }
        throw retryError;
      }
    }
  }
  constructor(opts = {}) {
    super();
    const apiConfig = opts.api ?? {};
    this.apiClient = new ConnectApiClient({
      baseUrl: apiConfig.baseUrl ?? DEFAULT_API_BASE_URL,
      sessionKey: apiConfig.sessionKey ?? DEFAULT_SESSION_KEY,
      timeout: apiConfig.timeout
    });
    this.sessionKey = apiConfig.sessionKey ?? DEFAULT_SESSION_KEY;
    this.openConnect = opts.openConnect ?? null;
    this.connectPageUrl = opts.connectPageUrl ?? DEFAULT_CONNECT_PAGE_URL;
    if (opts.appName) {
      this.appName = opts.appName;
    }
    if (opts.state) {
      this.applyState(opts.state);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Keyring API: Serialization
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Serialize keyring state for persistence.
   * This includes identifiers (e.g. deviceId, sessionKey, derived accounts), but no passwords or pairing codes.
   */
  async serialize() {
    return {
      deviceId: this.deviceId,
      deviceType: this.deviceType,
      sessionKey: this.sessionKey,
      hdPath: this.hdPath,
      page: this.page,
      // MetaMask persists this state field; keep the public name stable, but
      // treat it as the next account index to derive when adding accounts.
      unlockedAccount: this.nextAccountIndex,
      accounts: [...this.accounts],
      appName: this.appName
    };
  }
  /**
   * Deserialize keyring state from persistence.
   */
  deserialize(opts = {}) {
    this.applyState(opts);
    return Promise.resolve();
  }
  applyState(opts = {}) {
    if (opts.deviceId !== void 0) this.deviceId = opts.deviceId;
    if (opts.deviceType !== void 0) this.deviceType = opts.deviceType;
    if (opts.sessionKey !== void 0) {
      this.sessionKey = opts.sessionKey;
      this.apiClient?.setSessionKey(this.sessionKey);
    }
    if (opts.hdPath !== void 0) this.hdPath = opts.hdPath;
    if (opts.page !== void 0) this.page = opts.page;
    if (opts.unlockedAccount !== void 0) this.nextAccountIndex = opts.unlockedAccount;
    if (opts.accounts !== void 0) this.accounts = [...opts.accounts];
    if (opts.appName !== void 0) this.appName = opts.appName;
    if (opts.name !== void 0 && !opts.appName) this.appName = opts.name;
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Keyring API: Unlock / Connect
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Check if the keyring is connected (has a valid session).
   */
  isUnlocked() {
    return this.deviceId !== null;
  }
  /**
   * Unlock the keyring by opening the external connect flow.
   */
  async unlock() {
    if (this.isUnlocked()) {
      return "Unlocked";
    }
    if (!this.openConnect) {
      throw new Error("No openConnect callback configured. Cannot unlock keyring.");
    }
    const requestId = crypto.randomUUID();
    const connectUrl = this.buildConnectUrl(requestId);
    const result = await this.openConnect(connectUrl);
    this.deviceId = result.deviceId;
    this.sessionKey = result.sessionKey;
    this.apiClient?.setSessionKey(this.sessionKey);
    if (result.deviceType) {
      this.deviceType = result.deviceType;
    }
    return "Unlocked";
  }
  /**
   * Build the external connect URL.
   */
  buildConnectUrl(requestId) {
    const params = new URLSearchParams({
      v: "1",
      client: this.sessionKey,
      requestId,
      forceLogin: "true"
    });
    const origin = typeof globalThis !== "undefined" && typeof globalThis.location?.origin === "string" ? globalThis.location.origin : "";
    if (origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://")) {
      params.set("targetOrigin", origin);
    }
    return `${this.connectPageUrl}?${params.toString()}`;
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Keyring API: HD Path
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Set the HD derivation path template.
   */
  setHdPath(hdPath) {
    this.hdPath = hdPath;
    this.page = 0;
  }
  /**
   * Get the current HD derivation path template.
   */
  getHdPath() {
    return this.hdPath;
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Keyring API: Account Pagination
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Set the account index to unlock when adding accounts.
   */
  setAccountToUnlock(index) {
    const parsed = typeof index === "string" ? Number.parseInt(index, 10) : index;
    if (!Number.isFinite(parsed) || Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      throw new Error(`Invalid account index: ${String(index)}`);
    }
    this.nextAccountIndex = parsed;
  }
  /**
   * Get the first page of accounts.
   */
  async getFirstPage() {
    this.page = 0;
    return this.getPage(0);
  }
  /**
   * Get the next page of accounts.
   */
  async getNextPage() {
    return this.getPage(1);
  }
  /**
   * Get the previous page of accounts.
   */
  async getPreviousPage() {
    return this.getPage(-1);
  }
  /**
   * Internal: fetch a page of accounts from the API.
   */
  async getPage(increment) {
    await this.ensureUnlocked();
    const nextPage = Math.max(0, this.page + increment);
    const startIdx = nextPage * PER_PAGE;
    try {
      const addresses = await this.fetchAddresses(PER_PAGE, startIdx);
      this.page = nextPage;
      return addresses.map((address, i) => ({
        address,
        balance: null,
        // MetaMask fetches balances separately
        index: startIdx + i
      }));
    } catch (error) {
      if (error instanceof ConnectApiError) {
        this.handleConnectApiError(error);
      }
      throw error;
    }
  }
  /**
   * Fetch addresses from the derivation API.
   */
  async fetchAddresses(count, startIdx) {
    const startPath = parseHdPath(this.hdPath, startIdx);
    const iterIdx = findIterIdx(this.hdPath);
    const needsIterIdx = iterIdx >= 0;
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      if (needsIterIdx) {
        const response2 = await client.deriveAddresses(deviceId, startPath, count, iterIdx);
        return response2.addresses;
      }
      const response = await client.deriveAddresses(deviceId, startPath, count);
      return response.addresses;
    });
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Keyring API: Account Management
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Add accounts starting from the unlocked account index.
   * Returns only the newly added addresses.
   */
  async addAccounts(n = 1) {
    if (n <= 0) {
      throw new Error("Number of accounts to add must be positive");
    }
    await this.ensureUnlocked();
    const addresses = await this.fetchAddresses(n, this.nextAccountIndex);
    const newlyAdded = [];
    for (let i = 0; i < addresses.length; i++) {
      const rawAddress = addresses[i];
      if (!rawAddress) continue;
      const address = normalizeAddress(rawAddress);
      const accountIndex = this.nextAccountIndex + i;
      const exists = this.accounts.some((acc) => normalizeAddress(acc.address) === address && acc.hdPath === this.hdPath);
      if (!exists) {
        const signerPath = getSignerPath(this.hdPath, accountIndex);
        this.accounts.push({
          address,
          signerPath,
          hdPath: this.hdPath,
          index: accountIndex
        });
        newlyAdded.push(address);
      }
    }
    return newlyAdded;
  }
  /**
   * Get all imported account addresses.
   */
  async getAccounts() {
    return this.accounts.map((acc) => acc.address);
  }
  /**
   * Remove an account by address.
   */
  removeAccount(address) {
    const normalized = normalizeAddress(address);
    this.accounts = this.accounts.filter((acc) => normalizeAddress(acc.address) !== normalized);
  }
  /**
   * Forget the device and clear all state.
   */
  forgetDevice() {
    this.deviceId = null;
    this.deviceType = null;
    this.accounts = [];
    this.page = 0;
    this.nextAccountIndex = 0;
    this.hdPath = STANDARD_HD_PATH;
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Keyring API: Signing
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Sign a transaction.
   * Returns a signed ethereumjs transaction object.
   */
  async signTransaction(address, tx) {
    await this.ensureUnlocked();
    const account = this.findAccountByAddress(address);
    if (!account) {
      throw new Error(`Account not found: ${address}`);
    }
    const chainId = this.getChainIdFromTx(tx);
    const signerAddress = normalizeAddress(address);
    const txForApi = this.serializeTxForApi(tx);
    txForApi.from = signerAddress;
    const result = await this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.signTransaction(deviceId, txForApi, chainId, account.signerPath);
    });
    return this.applySignatureToTx(tx, result);
  }
  /**
   * Sign a personal message.
   */
  async signPersonalMessage(address, message) {
    await this.ensureUnlocked();
    const account = this.findAccountByAddress(address);
    if (!account) {
      throw new Error(`Account not found: ${address}`);
    }
    const result = await this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.signPersonalMessage(deviceId, message, address, void 0, account.signerPath);
    });
    return result.signature;
  }
  /**
   * Sign typed data (EIP-712).
   */
  async signTypedData(address, typedData, opts) {
    if (opts?.version && opts.version !== "V3" && opts.version !== "V4") {
      throw new Error(`Only signTypedData V3 and V4 are supported. Got: ${opts.version}`);
    }
    await this.ensureUnlocked();
    const account = this.findAccountByAddress(address);
    if (!account) {
      throw new Error(`Account not found: ${address}`);
    }
    const chainId = extractTypedDataChainId(typedData);
    const result = await this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.signTypedData(deviceId, address, typedData, chainId, account.signerPath);
    });
    return result.signature;
  }
  /**
   * Legacy alias for signPersonalMessage.
   */
  async signMessage(address, message) {
    if (typeof message === "string") {
      return this.signPersonalMessage(address, message);
    }
    if (message && typeof message === "object") {
      const record = message;
      if (typeof record.payload === "string") {
        return this.signPersonalMessage(address, record.payload);
      }
    }
    throw new Error("Invalid message format");
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Keyring API: Bitcoin
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Sync Bitcoin wallet state for the active device session.
   */
  async btcSync(options = {}) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.btcSync(deviceId, options);
    });
  }
  /**
   * Fetch Bitcoin balance and pricing summary.
   */
  async btcSummary(params = {}) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.btcSummary(deviceId, params);
    });
  }
  /**
   * Fetch paginated Bitcoin transactions.
   */
  async btcTransactions(params = {}) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.btcTransactions(deviceId, params);
    });
  }
  /**
   * Send a Bitcoin transaction.
   */
  async btcSend(payload) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.btcSend(deviceId, payload);
    });
  }
  /**
   * Fetch a Bitcoin extended public key.
   */
  async btcXpub(params = {}) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.btcXpub(deviceId, params);
    });
  }
  /**
   * Set and persist the Bitcoin wallet purpose preset.
   */
  async btcSetPurpose(payload) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.btcSetPurpose(deviceId, payload);
    });
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Keyring API: Solana
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Fetch Solana accounts for the active device.
   */
  async solanaAccounts() {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.solanaAccounts(deviceId);
    });
  }
  /**
   * Sign a Solana message.
   */
  async solanaSignMessage(payload) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.solanaSignMessage(deviceId, payload);
    });
  }
  /**
   * Sign a Solana transaction.
   */
  async solanaSignTransaction(payload) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.solanaSignTransaction(deviceId, payload);
    });
  }
  /**
   * Sign multiple Solana transactions.
   */
  async solanaSignAllTransactions(payload) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.solanaSignAllTransactions(deviceId, payload);
    });
  }
  /**
   * Sign and send a Solana transaction for a target Solana chain ID.
   */
  async solanaSignAndSendTransaction(payload, chainId) {
    const normalizedChainId = chainId.trim();
    if (!normalizedChainId) {
      throw new Error("chainId is required for solanaSignAndSendTransaction");
    }
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.solanaSignAndSendTransaction(deviceId, payload, normalizedChainId);
    });
  }
  /**
   * Sign a Cosmos payload.
   * Firmware auto-detects whether the payload is Direct or Amino.
   */
  async cosmosSign(payload, opts) {
    await this.ensureUnlocked();
    return this.executeWithReconnect(async () => {
      const { client, deviceId } = this.assertConnected();
      return client.cosmosSign(deviceId, payload, opts?.signerPath);
    });
  }
  /**
   * Export account - not supported for hardware wallets.
   */
  async exportAccount(_address) {
    throw new Error("exportAccount not supported by hardware wallets");
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // Internal Helpers
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Ensure the keyring is unlocked.
   */
  async ensureUnlocked() {
    if (!this.isUnlocked()) {
      await this.unlock();
    }
  }
  /**
   * Assert connection is ready and return validated client/deviceId.
   */
  assertConnected() {
    if (!this.apiClient || !this.deviceId) {
      throw new Error("Keyring not connected");
    }
    return { client: this.apiClient, deviceId: this.deviceId };
  }
  /**
   * Find an account by address.
   */
  findAccountByAddress(address) {
    const normalized = normalizeAddress(address);
    return this.accounts.find((acc) => normalizeAddress(acc.address) === normalized);
  }
  /**
   * Get chain ID from a transaction object.
   */
  getChainIdFromTx(tx) {
    const toHexChainId2 = (value) => {
      if (typeof value === "bigint") {
        return `0x${value.toString(16)}`;
      }
      if (typeof value === "number") {
        if (!Number.isFinite(value)) return "0x1";
        return `0x${BigInt(value).toString(16)}`;
      }
      if (typeof value === "string") {
        try {
          return `0x${BigInt(value).toString(16)}`;
        } catch {
          return "0x1";
        }
      }
      return "0x1";
    };
    if (!tx || typeof tx !== "object") return "0x1";
    const record = tx;
    const common = record.common;
    if (common && typeof common === "object") {
      const commonRecord = common;
      if (typeof commonRecord.chainIdBN === "function") {
        const bn = commonRecord.chainIdBN();
        const bnRecord = bn;
        if (bnRecord && typeof bnRecord.toString === "function") {
          return `0x${bnRecord.toString(16)}`;
        }
      }
      if (typeof commonRecord.chainId === "function") {
        const chainId = commonRecord.chainId();
        return toHexChainId2(chainId);
      }
    }
    if (record.chainId !== void 0) {
      return toHexChainId2(record.chainId);
    }
    return "0x1";
  }
  /**
   * Serialize a transaction for the API.
   */
  serializeTxForApi(tx) {
    if (!tx || typeof tx !== "object") {
      return {};
    }
    const record = tx;
    const json = typeof record.toJSON === "function" ? record.toJSON() : tx;
    if (!json || typeof json !== "object") {
      return {};
    }
    const result = {
      ...json
    };
    const txType = record.type;
    if (result.type === void 0 && txType !== void 0) {
      result.type = txType;
    }
    return result;
  }
  /**
   * Apply a signature to a transaction.
   */
  applySignatureToTx(tx, sig) {
    try {
      if (!tx || typeof tx !== "object") {
        throw new Error("Transaction is not an object");
      }
      const record = tx;
      const txDataRaw = typeof record.toJSON === "function" ? record.toJSON() : { ...record };
      if (!txDataRaw || typeof txDataRaw !== "object") {
        throw new Error("Transaction cannot be serialized");
      }
      const txData = txDataRaw;
      if (sig.r && sig.s && sig.v !== void 0) {
        txData.r = sig.r.startsWith("0x") ? sig.r : `0x${sig.r}`;
        txData.s = sig.s.startsWith("0x") ? sig.s : `0x${sig.s}`;
        txData.v = typeof sig.v === "number" ? `0x${sig.v.toString(16)}` : sig.v;
      } else if (sig.signature) {
        const sigHex = sig.signature.replace(/^0x/, "");
        txData.r = `0x${sigHex.slice(0, 64)}`;
        txData.s = `0x${sigHex.slice(64, 128)}`;
        const vByte = Number.parseInt(sigHex.slice(128, 130), 16);
        txData.v = `0x${vByte.toString(16)}`;
      }
      const ctor = record.constructor;
      if (ctor && typeof ctor.fromTxData === "function") {
        return ctor.fromTxData(txData, {
          common: record.common,
          freeze: Object.isFrozen(tx)
        });
      }
      return txData;
    } catch (error) {
      throw new Error("Failed to apply signature to transaction", {
        cause: error instanceof Error ? error : void 0
      });
    }
  }
};

export { ConnectApiClient, ConnectApiError, GridPlusKeyring, INTERNAL_VAR_HD_PATH, LEGACY_HD_PATH, PER_PAGE, STANDARD_HD_PATH, GridPlusKeyring as default, findIterIdx, formatSignerPath, getSignerPath, hasInternalVarIdx, isValidSignerPath, parseHdPath };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
