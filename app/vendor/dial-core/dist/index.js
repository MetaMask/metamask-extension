/* @dial-wtf/core - Platform-agnostic types and interfaces */

// src/types/client.ts
var SDK_VERSION = "0.3.0";
var API_BASE_URLS = {
  mainnet: "https://dial.wtf/api",
  alpha: "https://alpha.dial.wtf/api",
  staging: "https://staging.dial.wtf/api",
  testnet: "https://testnet.dial.wtf/api",
  devnet: "https://dev.dial.wtf/api"
};
var DEFAULT_NETWORK = "alpha";

// src/errors.ts
var DialError = class _DialError extends Error {
  code;
  statusCode;
  details;
  constructor(message, code, statusCode, details) {
    super(message);
    this.name = "DialError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, _DialError.prototype);
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    };
  }
};
var AuthError = class _AuthError extends DialError {
  constructor(message, code, details) {
    super(message, code ?? "AUTH_ERROR", 401, details);
    this.name = "AuthError";
    Object.setPrototypeOf(this, _AuthError.prototype);
  }
};
var ApiError = class _ApiError extends DialError {
  constructor(message, statusCode, code, details) {
    super(message, code ?? "API_ERROR", statusCode, details);
    this.name = "ApiError";
    Object.setPrototypeOf(this, _ApiError.prototype);
  }
  static fromResponse(status, body) {
    if (typeof body === "object" && body !== null) {
      const errorBody = body;
      return new _ApiError(
        String(errorBody["error"] ?? errorBody["message"] ?? "Unknown API error"),
        status,
        String(errorBody["code"] ?? "API_ERROR"),
        errorBody["details"]
      );
    }
    return new _ApiError("Unknown API error", status);
  }
};
var NetworkError = class _NetworkError extends DialError {
  constructor(message, details) {
    super(message, "NETWORK_ERROR", void 0, details);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, _NetworkError.prototype);
  }
};
var TimeoutError = class _TimeoutError extends DialError {
  constructor(message) {
    super(message ?? "Request timed out", "TIMEOUT_ERROR", 408);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, _TimeoutError.prototype);
  }
};
var ValidationError = class _ValidationError extends DialError {
  field;
  constructor(message, field, details) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
    this.field = field;
    Object.setPrototypeOf(this, _ValidationError.prototype);
  }
};
var RateLimitError = class _RateLimitError extends DialError {
  retryAfter;
  constructor(message, retryAfter) {
    super(message ?? "Rate limit exceeded", "RATE_LIMIT_ERROR", 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, _RateLimitError.prototype);
  }
};
var SessionExpiredError = class _SessionExpiredError extends AuthError {
  constructor() {
    super("Session expired. Please re-authenticate.", "SESSION_EXPIRED");
    this.name = "SessionExpiredError";
    Object.setPrototypeOf(this, _SessionExpiredError.prototype);
  }
};
var NotFoundError = class _NotFoundError extends DialError {
  constructor(message, resourceType) {
    super(message, "NOT_FOUND", 404, resourceType ? { resourceType } : void 0);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, _NotFoundError.prototype);
  }
};
var PermissionDeniedError = class _PermissionDeniedError extends DialError {
  constructor(message, requiredPermission) {
    super(
      message ?? "Permission denied",
      "PERMISSION_DENIED",
      403,
      requiredPermission ? { requiredPermission } : void 0
    );
    this.name = "PermissionDeniedError";
    Object.setPrototypeOf(this, _PermissionDeniedError.prototype);
  }
};

// src/interfaces/storage.ts
var MemoryStorage = class {
  store = /* @__PURE__ */ new Map();
  async getItem(key) {
    return this.store.get(key) ?? null;
  }
  async setItem(key, value) {
    this.store.set(key, value);
  }
  async removeItem(key) {
    this.store.delete(key);
  }
};
var BrowserStorage = class {
  get _storage() {
    return globalThis["localStorage"];
  }
  async getItem(key) {
    return this._storage?.getItem(key) ?? null;
  }
  async setItem(key, value) {
    this._storage?.setItem(key, value);
  }
  async removeItem(key) {
    this._storage?.removeItem(key);
  }
};

// src/utils/environment.ts
function detectEnvironment() {
  if (typeof globalThis !== "undefined" && typeof globalThis["chrome"] !== "undefined") {
    const chrome = globalThis["chrome"];
    if (chrome && typeof chrome["runtime"] === "object" && chrome["runtime"] !== null) {
      const runtime = chrome["runtime"];
      if (typeof runtime["id"] === "string") {
        return "extension";
      }
    }
  }
  if (typeof globalThis["window"] !== "undefined" && typeof globalThis["document"] !== "undefined") {
    return "browser";
  }
  if (typeof globalThis["process"] !== "undefined" && globalThis["process"]?.["versions"] != null && globalThis["process"]?.["versions"]?.["node"] != null) {
    return "node";
  }
  return "unknown";
}
var ENVIRONMENT = detectEnvironment();
var IS_BROWSER = ENVIRONMENT === "browser";
var IS_NODE = ENVIRONMENT === "node";
var IS_EXTENSION = ENVIRONMENT === "extension";
var IS_BROWSER_LIKE = IS_BROWSER || IS_EXTENSION;
var BROWSER_ONLY_FEATURES = [
  "calls.getLocalStream",
  "calls.getRemoteStream",
  "conference.getParticipantStream",
  "conference.startScreenShare",
  "voicemail.download",
  "profile.updateAvatar"
];
var ISOMORPHIC_FEATURES = [
  "auth.*",
  "profile.*",
  "messages.*",
  "calls.start",
  "calls.answer",
  "calls.decline",
  "calls.end",
  "calls.mute",
  "calls.unmute",
  "calls.getHistory",
  "voicemail.getAll",
  "voicemail.get",
  "voicemail.markAsRead",
  "voicemail.transcribe",
  "conference.create",
  "conference.join",
  "conference.leave",
  "conference.getParticipants",
  "partyLines.*",
  "registry.*"
];
function assertBrowser(feature) {
  if (!IS_BROWSER && !IS_EXTENSION) {
    throw new Error(
      `[Dial SDK] The feature "${feature}" is only available in browser/extension environments. It requires browser-specific APIs (MediaStream, WebRTC, etc.) that are not available in Node.js.`
    );
  }
}
function assertNode(feature) {
  if (!IS_NODE) {
    throw new Error(
      `[Dial SDK] The feature "${feature}" is only available in Node.js environments.`
    );
  }
}
function getFetch() {
  if (typeof globalThis.fetch !== "undefined") {
    return globalThis.fetch.bind(globalThis);
  }
  throw new Error(
    "[Dial SDK] No fetch implementation found. Please use Node.js 18+ or provide a custom fetch implementation."
  );
}
function warnBrowserOnly(feature) {
  if (!IS_BROWSER && !IS_EXTENSION) {
    console.warn(
      `[Dial SDK] Warning: "${feature}" has limited functionality in non-browser environments.`
    );
  }
}

export { API_BASE_URLS, ApiError, AuthError, BROWSER_ONLY_FEATURES, BrowserStorage, DEFAULT_NETWORK, DialError, ENVIRONMENT, ISOMORPHIC_FEATURES, IS_BROWSER, IS_BROWSER_LIKE, IS_EXTENSION, IS_NODE, MemoryStorage, NetworkError, NotFoundError, PermissionDeniedError, RateLimitError, SDK_VERSION, SessionExpiredError, TimeoutError, ValidationError, assertBrowser, assertNode, detectEnvironment, getFetch, warnBrowserOnly };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map