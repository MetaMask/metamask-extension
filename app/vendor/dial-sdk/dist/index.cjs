'use strict';

var siwe = require('siwe');
var EventEmitter3 = require('eventemitter3');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var EventEmitter3__default = /*#__PURE__*/_interopDefault(EventEmitter3);

/* @dial-wtf/sdk - Web3-native communication primitives */

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

// src/http/client.ts
var HttpClient = class {
  config;
  authToken;
  constructor(config) {
    this.config = config;
  }
  /** Set the authentication token for requests */
  setAuthToken(token) {
    this.authToken = token;
  }
  /** Get the current auth token */
  getAuthToken() {
    return this.authToken;
  }
  /** Build full URL for an endpoint */
  buildUrl(endpoint, params) {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${base}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== void 0) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  }
  /** Build request headers */
  buildHeaders(customHeaders) {
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": `@dial/sdk`
    };
    if (this.config.apiKey) {
      headers["x-api-key"] = this.config.apiKey;
    }
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }
    return headers;
  }
  /** Make an HTTP request */
  async request(endpoint, options = {}) {
    const { method = "GET", headers, body, timeout, signal } = options;
    const url = this.buildUrl(endpoint);
    const requestHeaders = this.buildHeaders(headers);
    const controller = new AbortController();
    const timeoutMs = timeout ?? this.config.timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      if (this.config.debug) {
        console.log(`[Dial SDK] ${method} ${url}`);
      }
      const response = await this.config.fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : void 0,
        signal: signal ?? controller.signal
      });
      clearTimeout(timeoutId);
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      if (!response.ok) {
        this.handleErrorResponse(response.status, data, response.headers);
      }
      if (typeof data === "object" && data !== null && "data" in data) {
        return data.data;
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new TimeoutError();
        }
        if (error instanceof ApiError || error instanceof AuthError || error instanceof NotFoundError || error instanceof RateLimitError || error instanceof PermissionDeniedError) {
          throw error;
        }
        throw new NetworkError(error.message);
      }
      throw new NetworkError("Unknown network error");
    }
  }
  /** Handle error responses */
  handleErrorResponse(status, body, headers) {
    switch (status) {
      case 401:
        throw new AuthError(this.getErrorMessage(body, "Unauthorized"));
      case 403:
        throw new PermissionDeniedError(this.getErrorMessage(body, "Permission denied"));
      case 404:
        throw new NotFoundError(this.getErrorMessage(body, "Endpoint not found"));
      case 429: {
        const retryAfter = headers.get("retry-after");
        throw new RateLimitError(
          this.getErrorMessage(body, "Rate limit exceeded"),
          retryAfter ? parseInt(retryAfter, 10) : void 0
        );
      }
      default:
        throw ApiError.fromResponse(status, body);
    }
  }
  /** Extract error message from response body */
  getErrorMessage(body, fallback) {
    if (typeof body === "object" && body !== null) {
      const errorBody = body;
      if (typeof errorBody["error"] === "string") {
        return errorBody["error"];
      }
      if (typeof errorBody["message"] === "string") {
        return errorBody["message"];
      }
    }
    return fallback;
  }
  /** GET request */
  async get(endpoint, params, options) {
    if (params) {
      const urlParams = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== void 0 && value !== null) {
          if (value instanceof Date) {
            urlParams[key] = value.toISOString();
          } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            urlParams[key] = value;
          } else {
            urlParams[key] = String(value);
          }
        }
      }
      const url = this.buildUrl(endpoint, urlParams);
      return this.request(url.replace(this.config.baseUrl, ""), {
        ...options,
        method: "GET"
      });
    }
    return this.request(endpoint, {
      ...options,
      method: "GET"
    });
  }
  /** POST request */
  async post(endpoint, body, options) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body
    });
  }
  /** PUT request */
  async put(endpoint, body, options) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body
    });
  }
  /** PATCH request */
  async patch(endpoint, body, options) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body
    });
  }
  /** DELETE request */
  async delete(endpoint, options) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE"
    });
  }
};

// src/services/base.ts
var BaseService = class {
  http;
  apiVersion;
  constructor(http, apiVersion = "v1") {
    this.http = http;
    this.apiVersion = apiVersion;
  }
  /** Build endpoint path */
  endpoint(path) {
    return `/${this.apiVersion}${path}`;
  }
  /** Build endpoint path without version prefix */
  rawEndpoint(path) {
    return path;
  }
};

// src/services/auth.ts
var AuthService = class extends BaseService {
  constructor(http) {
    super(http);
  }
  /**
   * Get a nonce for authentication
   * The nonce should be used in the SIWE/SIWS message
   *
   * @param address - The wallet address to get a nonce for
   */
  async getNonce(address) {
    const response = await this.http.get(
      this.rawEndpoint("/siwe/nonce"),
      { address }
    );
    return response.nonce;
  }
  /**
   * Verify SIWE credentials and create session
   *
   * Parses the SIWE message to extract address, chainId, and nonce
   * as required by the PeerSpeak verify endpoint.
   */
  async verifySiwe(message, signature) {
    const parsed = new siwe.SiweMessage(message);
    const response = await this.http.post(
      this.rawEndpoint("/siwe/verify"),
      {
        message,
        signature,
        address: parsed.address,
        chainId: parsed.chainId,
        nonce: parsed.nonce
      }
    );
    return response;
  }
  /**
   * Verify SIWS credentials and create session
   */
  async verifySiws(message, signature) {
    const response = await this.http.post(
      this.rawEndpoint("/siws/verify"),
      { message, signature }
    );
    return response;
  }
  /**
   * Authenticate with provided credentials
   * Returns session data on success
   */
  async authenticate(credentials) {
    if (credentials.siwe) {
      return this.verifySiwe(
        credentials.siwe.message,
        credentials.siwe.signature
      );
    }
    if (credentials.siws) {
      return this.verifySiws(
        credentials.siws.message,
        credentials.siws.signature
      );
    }
    throw new ValidationError(
      "Either siwe or siws credentials must be provided"
    );
  }
  /**
   * Validate an existing session
   */
  async validateSession(session) {
    try {
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt <= /* @__PURE__ */ new Date()) {
        return false;
      }
      this.http.setAuthToken(session.token);
      const response = await this.http.get(
        this.rawEndpoint("/auth/validate")
      );
      return response.valid;
    } catch {
      return false;
    }
  }
  /**
   * Refresh session token
   */
  async refreshSession(session) {
    if (!session.refreshToken) {
      throw new AuthError("No refresh token available");
    }
    const response = await this.http.post(
      this.rawEndpoint("/auth/refresh"),
      { refreshToken: session.refreshToken }
    );
    return response;
  }
  /**
   * Logout and invalidate session
   */
  async logout() {
    await this.http.post(this.rawEndpoint("/auth/logout"));
  }
  /**
   * Get wallet address from session data
   */
  getWalletAddress(session) {
    return session.walletAddress;
  }
};

// src/services/party-lines.ts
var PartyLinesService = class extends BaseService {
  constructor(http) {
    super(http);
  }
  /**
   * Query party lines with filtering and pagination
   * No authentication required for read-only access
   */
  async query(options) {
    const response = await this.http.get(
      this.endpoint("/party-lines"),
      {
        isActive: options?.isActive,
        search: options?.search,
        limit: options?.limit,
        offset: options?.offset
      }
    );
    return response;
  }
  /**
   * Get all party lines (convenience method)
   */
  async getAll(options) {
    const response = await this.query(options);
    return response.partyLines;
  }
  /**
   * Get active party lines
   */
  async getActive(options) {
    const response = await this.query({ ...options, isActive: true });
    return response.partyLines;
  }
  /**
   * Search party lines by name or description
   */
  async search(searchTerm, options) {
    const response = await this.query({ ...options, search: searchTerm });
    return response.partyLines;
  }
  /**
   * Create a new party line
   * Requires API key authentication
   */
  async create(options) {
    const response = await this.http.post(
      this.endpoint("/party-lines"),
      options
    );
    return response;
  }
  /**
   * Get a party line by room code
   */
  async getByRoomCode(roomCode) {
    const response = await this.http.get(
      this.endpoint(`/party-lines/code/${roomCode}`)
    );
    return response;
  }
  /**
   * Get a party line by ID
   */
  async getById(id) {
    const response = await this.http.get(
      this.endpoint(`/party-lines/${id}`)
    );
    return response;
  }
};

// src/services/registry.ts
var RegistryService = class extends BaseService {
  constructor(http) {
    super(http);
  }
  /**
   * List public rooms
   */
  async listPublicRooms(params) {
    const response = await this.http.get(
      this.endpoint("/registry/rooms"),
      params ? { limit: params.limit, offset: params.offset } : void 0
    );
    return response;
  }
  /**
   * Get token info
   */
  async getTokenInfo(contractAddress) {
    const response = await this.http.get(
      this.endpoint(`/registry/tokens/${contractAddress}`)
    );
    return response;
  }
  /**
   * Search profiles
   */
  async searchProfiles(options) {
    const response = await this.http.get(
      this.endpoint("/registry/profiles/search"),
      options
    );
    return response;
  }
  /**
   * Get profile by ENS name
   */
  async getProfileByENS(ensName) {
    const response = await this.http.get(
      this.endpoint(`/registry/ens/${ensName}`)
    );
    return response;
  }
};
var DialEventEmitter = class {
  emitter;
  constructor() {
    this.emitter = new EventEmitter3__default.default();
  }
  /**
   * Subscribe to an event
   */
  on(event, listener) {
    this.emitter.on(event, listener);
  }
  /**
   * Subscribe to an event (only fires once)
   */
  once(event, listener) {
    this.emitter.once(event, listener);
  }
  /**
   * Unsubscribe from an event
   */
  off(event, listener) {
    if (listener) {
      this.emitter.off(event, listener);
    } else {
      this.emitter.removeAllListeners(event);
    }
  }
  /**
   * Emit an event
   */
  emit(event, payload) {
    this.emitter.emit(event, payload);
  }
  /**
   * Remove all listeners
   */
  removeAllListeners(event) {
    if (event) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
  }
  /**
   * Get listener count for an event
   */
  listenerCount(event) {
    return this.emitter.listenerCount(event);
  }
};

// src/services/calls.ts
var CallsService = class extends BaseService {
  localStream;
  remoteStreams = /* @__PURE__ */ new Map();
  constructor(http) {
    super(http);
  }
  /**
   * Start a call to another wallet address
   */
  async start(options) {
    const response = await this.http.post(
      this.endpoint("/calls"),
      options
    );
    return response;
  }
  /**
   * Answer an incoming call
   */
  async answer(callId) {
    const response = await this.http.post(
      this.endpoint(`/calls/${callId}/answer`)
    );
    return response;
  }
  /**
   * Decline an incoming call
   */
  async decline(callId, options) {
    await this.http.post(
      this.endpoint(`/calls/${callId}/decline`),
      options
    );
  }
  /**
   * End an active call
   */
  async end(callId) {
    await this.http.post(this.endpoint(`/calls/${callId}/end`));
  }
  /**
   * Get call by ID
   */
  async get(callId) {
    const response = await this.http.get(
      this.endpoint(`/calls/${callId}`)
    );
    return response;
  }
  /**
   * Get call history
   */
  async getHistory(params) {
    const queryParams = params ? { ...params } : void 0;
    const response = await this.http.get(
      this.endpoint("/calls"),
      queryParams
    );
    if (!Array.isArray(response) && "calls" in response) {
      return response.calls;
    }
    return response;
  }
  /**
   * Mute your microphone
   */
  async mute(callId) {
    await this.http.post(this.endpoint(`/calls/${callId}/mute`));
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  }
  /**
   * Unmute your microphone
   */
  async unmute(callId) {
    await this.http.post(this.endpoint(`/calls/${callId}/unmute`));
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  }
  /**
   * Toggle mute state
   */
  async toggleMute(callId) {
    await this.http.post(this.endpoint(`/calls/${callId}/toggle-mute`));
  }
  /**
   * Disable video
   */
  async disableVideo(callId) {
    await this.http.post(this.endpoint(`/calls/${callId}/disable-video`));
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  }
  /**
   * Enable video
   */
  async enableVideo(callId) {
    await this.http.post(this.endpoint(`/calls/${callId}/enable-video`));
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  }
  /**
   * Toggle video state
   */
  async toggleVideo(callId) {
    await this.http.post(this.endpoint(`/calls/${callId}/toggle-video`));
  }
  /**
   * Set speaker (earpiece or speaker)
   */
  async setSpeaker(callId, enabled) {
    await this.http.post(
      this.endpoint(`/calls/${callId}/speaker`),
      { enabled }
    );
  }
  /**
   * Get local media stream for a call
   */
  getLocalStream(_callId) {
    return this.localStream;
  }
  /**
   * Get remote media stream for a call
   */
  getRemoteStream(callId) {
    return this.remoteStreams.get(callId);
  }
  /**
   * Start recording the call
   */
  async startRecording(callId) {
    const response = await this.http.post(
      this.endpoint(`/calls/${callId}/recording/start`)
    );
    return response;
  }
  /**
   * Stop recording the call
   */
  async stopRecording(callId) {
    const response = await this.http.post(
      this.endpoint(`/calls/${callId}/recording/stop`)
    );
    return response;
  }
  /**
   * Set custom ringtone
   */
  setRingtone(audioUrl) {
    if (typeof window !== "undefined" && typeof Audio !== "undefined") {
      const audio = new Audio(audioUrl);
      audio.preload = "auto";
    }
  }
  /**
   * Internal: Set local stream (called by WebRTC layer)
   * @internal
   */
  _setLocalStream(stream) {
    this.localStream = stream;
  }
  /**
   * Internal: Set remote stream (called by WebRTC layer)
   * @internal
   */
  _setRemoteStream(callId, stream) {
    this.remoteStreams.set(callId, stream);
  }
  /**
   * Internal: Clear streams when call ends
   * @internal
   */
  _clearStreams(callId) {
    this.remoteStreams.delete(callId);
  }
};

// src/services/chats.ts
var ChatService = class extends BaseService {
  constructor(http) {
    super(http);
  }
  /**
   * Send a message to a wallet address
   */
  async send(options) {
    if (options.media?.file) {
      return this.sendWithMedia(options);
    }
    const response = await this.http.post(
      this.endpoint("/chat/messages"),
      {
        to: options.to,
        content: options.content,
        type: options.type ?? "text",
        threadId: options.threadId,
        provider: options.provider,
        encrypted: options.encrypted,
        replyTo: options.replyTo,
        mentions: options.mentions
      }
    );
    return response;
  }
  /**
   * Send message with media attachment
   */
  async sendWithMedia(options) {
    const response = await this.http.post(
      this.endpoint("/chat/messages"),
      {
        to: options.to,
        content: options.media?.caption ?? options.content,
        type: options.type,
        threadId: options.threadId,
        provider: options.provider,
        encrypted: options.encrypted,
        replyTo: options.replyTo,
        mentions: options.mentions,
        // Media will be uploaded separately in a real implementation
        hasMedia: true,
        mediaDuration: options.media?.duration
      }
    );
    return response;
  }
  /**
   * Get all threads (DMs and Groups)
   */
  async listThreads(params) {
    const response = await this.http.get(
      this.endpoint("/chat/threads"),
      params ? { ...params } : void 0
    );
    return response;
  }
  /**
   * Get conversation with a specific wallet
   * @deprecated Use listThreads() instead
   */
  async getConversations(params) {
    return this.listThreads(params);
  }
  /**
   * Get thread with a specific wallet
   */
  async getThread(options) {
    const response = await this.http.get(
      this.endpoint("/chat/threads"),
      {
        with: options.with,
        threadModel: options.threadModel,
        provider: options.provider
      }
    );
    return response;
  }
  /**
   * Get conversation with a specific wallet
   * @deprecated Use getThread() instead
   */
  async getConversation(options) {
    return this.getThread(options);
  }
  /**
   * Get messages with pagination
   */
  async listMessages(options) {
    const response = await this.http.get(
      this.endpoint("/chat/messages"),
      {
        with: options.with,
        threadId: options.threadId,
        before: options.before?.toString(),
        after: options.after?.toString(),
        limit: options.limit,
        offset: options.offset
      }
    );
    return response;
  }
  /**
   * Get messages with pagination
   * @deprecated Use listMessages() instead
   */
  async getMessages(options) {
    return this.listMessages(options);
  }
  /**
   * Mark a message as read
   */
  async markAsRead(messageId) {
    await this.http.post(this.endpoint(`/chat/messages/${messageId}/read`));
  }
  /**
   * Add reaction to a message
   */
  async addReaction(options) {
    await this.http.post(
      this.endpoint(`/chat/messages/${options.messageId}/reactions`),
      { emoji: options.emoji }
    );
  }
  /**
   * Remove reaction from a message
   */
  async removeReaction(options) {
    await this.http.delete(
      this.endpoint(`/chat/messages/${options.messageId}/reactions/${encodeURIComponent(options.emoji)}`)
    );
  }
  /**
   * Start typing indicator
   */
  async startTyping(options) {
    await this.http.post(
      this.endpoint("/chat/typing"),
      { threadId: options.threadId, isTyping: true }
    );
  }
  /**
   * Stop typing indicator
   */
  async stopTyping(options) {
    await this.http.post(
      this.endpoint("/chat/typing"),
      { threadId: options.threadId, isTyping: false }
    );
  }
  /**
   * Create a DM thread
   */
  async createDM(options) {
    const response = await this.http.post(
      this.endpoint("/chat/threads"),
      {
        type: "dm",
        participants: [options.otherDialUserId]
      }
    );
    return response;
  }
  /**
   * Create a topic-based thread
   * @deprecated Use createDM() or createGroup() instead
   */
  async createThread(options) {
    const response = await this.http.post(
      this.endpoint("/chat/threads"),
      options
    );
    return response;
  }
  /**
   * Create a managed thread (for platform developers)
   */
  async createManagedThread(options) {
    const response = await this.http.post(
      this.endpoint("/chat/threads/managed"),
      options
    );
    return response;
  }
  /**
   * List managed threads
   */
  async listManagedThreads(options) {
    const response = await this.http.get(
      this.endpoint("/chat/threads/managed"),
      options?.filters
    );
    return response;
  }
  /**
   * Archive a thread
   */
  async archiveThread(threadId) {
    await this.http.post(this.endpoint(`/chat/threads/${threadId}/archive`));
  }
  /**
   * Create a group
   */
  async createGroup(options) {
    const response = await this.http.post(
      this.endpoint("/chat/threads"),
      {
        type: "group",
        name: options.name,
        participants: options.participants,
        provider: options.provider
        // Avatar would be uploaded separately
      }
    );
    return response;
  }
  /**
   * Invite users to a group
   */
  async inviteToGroup(options) {
    await this.http.post(
      this.endpoint(`/chat/threads/${options.groupId}/invite`),
      { addresses: options.addresses }
    );
  }
  /**
   * Add member to group
   */
  async addMember(options) {
    await this.http.post(
      this.endpoint(`/chat/threads/${options.threadId}/members`),
      { address: options.address }
    );
  }
  /**
   * Add member to group
   * @deprecated Use addMember() instead
   */
  async addGroupMember(options) {
    return this.addMember({ threadId: options.groupId, address: options.address });
  }
  /**
   * Remove member from group
   */
  async removeMember(options) {
    await this.http.delete(
      this.endpoint(`/chat/threads/${options.threadId}/members/${options.address}`)
    );
  }
  /**
   * Remove member from group
   * @deprecated Use removeMember() instead
   */
  async removeGroupMember(options) {
    return this.removeMember({ threadId: options.groupId, address: options.address });
  }
  /**
   * Leave a group
   */
  async leaveGroup(threadId) {
    await this.http.post(this.endpoint(`/chat/threads/${threadId}/leave`));
  }
  /**
   * Update group info
   */
  async updateGroup(options) {
    const response = await this.http.patch(
      this.endpoint(`/chat/threads/${options.threadId}`),
      { name: options.name }
    );
    return response;
  }
  /**
   * Delete a message
   */
  async delete(messageId, options) {
    await this.http.delete(
      this.endpoint(`/chat/messages/${messageId}`),
      { headers: options?.forEveryone ? { "X-Delete-For-Everyone": "true" } : void 0 }
    );
  }
  /**
   * Search messages (local only - server-side search incompatible with E2EE)
   */
  async search(options) {
    const response = await this.http.get(
      this.endpoint("/chat/messages/search"),
      options
    );
    return response;
  }
};

// src/services/profile.ts
var ProfileService = class extends BaseService {
  constructor(http) {
    super(http);
  }
  /**
   * Get the current user's profile
   */
  async get() {
    const response = await this.http.get(
      this.endpoint("/profile")
    );
    return response;
  }
  /**
   * Get profile by wallet address
   */
  async getProfile(options) {
    const response = await this.http.get(
      this.endpoint(`/profiles/${options.walletAddress}`)
    );
    return response;
  }
  /**
   * Update the current user's profile
   */
  async update(options) {
    const response = await this.http.patch(
      this.endpoint("/profile"),
      options
    );
    return response;
  }
  /**
   * Update avatar
   */
  async updateAvatar(_options) {
    const response = await this.http.post(
      this.endpoint("/profile/avatar"),
      { hasAvatar: true }
    );
    return response;
  }
  /**
   * Set status
   */
  async setStatus(status, options) {
    await this.http.post(
      this.endpoint("/profile/status"),
      { status, customMessage: options?.customMessage }
    );
  }
  /**
   * Get current status
   */
  async getStatus() {
    const response = await this.http.get(
      this.endpoint("/profile/status")
    );
    return response;
  }
  /**
   * Update preferences
   */
  async updatePreferences(preferences) {
    await this.http.patch(
      this.endpoint("/profile/preferences"),
      preferences
    );
  }
  /**
   * Update privacy settings
   */
  async updatePrivacy(privacy) {
    await this.http.patch(
      this.endpoint("/profile/privacy"),
      privacy
    );
  }
  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings) {
    await this.http.patch(
      this.endpoint("/profile/notifications"),
      settings
    );
  }
  /**
   * Enable Do Not Disturb
   */
  async enableDoNotDisturb(options) {
    await this.http.post(
      this.endpoint("/profile/dnd"),
      { enabled: true, ...options }
    );
  }
  /**
   * Disable Do Not Disturb
   */
  async disableDoNotDisturb() {
    await this.http.post(
      this.endpoint("/profile/dnd"),
      { enabled: false }
    );
  }
  /**
   * Block a user
   */
  async blockUser(walletAddress) {
    await this.http.post(
      this.endpoint("/profile/blocked"),
      { walletAddress }
    );
  }
  /**
   * Unblock a user
   */
  async unblockUser(walletAddress) {
    await this.http.delete(
      this.endpoint(`/profile/blocked/${walletAddress}`)
    );
  }
  /**
   * Get blocked users
   */
  async getBlockedUsers() {
    const response = await this.http.get(
      this.endpoint("/profile/blocked")
    );
    return response;
  }
  /**
   * Link ENS name
   */
  async linkENS(options) {
    await this.http.post(
      this.endpoint("/profile/verify/ens"),
      options
    );
  }
  /**
   * Verify Twitter
   */
  async verifyTwitter(options) {
    await this.http.post(
      this.endpoint("/profile/verify/twitter"),
      options
    );
  }
  /**
   * Verify GitHub
   */
  async verifyGithub(options) {
    await this.http.post(
      this.endpoint("/profile/verify/github"),
      options
    );
  }
  /**
   * Add contact
   */
  async addContact(options) {
    const response = await this.http.post(
      this.endpoint("/profile/contacts"),
      options
    );
    return response;
  }
  /**
   * Get contacts
   */
  async getContacts(params) {
    const response = await this.http.get(
      this.endpoint("/profile/contacts"),
      params ? { ...params } : void 0
    );
    return response;
  }
  /**
   * Update contact
   */
  async updateContact(options) {
    const response = await this.http.patch(
      this.endpoint(`/profile/contacts/${options.walletAddress}`),
      options
    );
    return response;
  }
  /**
   * Remove contact
   */
  async removeContact(walletAddress) {
    await this.http.delete(
      this.endpoint(`/profile/contacts/${walletAddress}`)
    );
  }
};

// src/services/voicemail.ts
var VoicemailService = class extends BaseService {
  constructor(http) {
    super(http);
  }
  /**
   * Start recording a voicemail
   */
  async startRecording(options) {
    const response = await this.http.post(
      this.endpoint("/voicemails/record"),
      options
    );
    return response;
  }
  /**
   * Stop recording a voicemail
   */
  async stopRecording(voicemailId) {
    const response = await this.http.post(
      this.endpoint(`/voicemails/${voicemailId}/stop`)
    );
    return response;
  }
  /**
   * Record a voicemail (convenience method)
   */
  async record(options) {
    return this.startRecording(options);
  }
  /**
   * Get all voicemails
   */
  async getAll(options) {
    const response = await this.http.get(
      this.endpoint("/voicemails"),
      {
        unreadOnly: options?.unreadOnly,
        limit: options?.limit,
        offset: options?.offset
      }
    );
    return response;
  }
  /**
   * Get a specific voicemail
   */
  async get(voicemailId) {
    const response = await this.http.get(
      this.endpoint(`/voicemails/${voicemailId}`)
    );
    return response;
  }
  /**
   * Mark voicemail as read
   */
  async markAsRead(voicemailId) {
    await this.http.post(this.endpoint(`/voicemails/${voicemailId}/read`));
  }
  /**
   * Request transcription for a voicemail
   */
  async transcribe(voicemailId) {
    const response = await this.http.post(
      this.endpoint(`/voicemails/${voicemailId}/transcribe`)
    );
    return response;
  }
  /**
   * Delete a voicemail
   */
  async delete(voicemailId) {
    await this.http.delete(this.endpoint(`/voicemails/${voicemailId}`));
  }
  /**
   * Archive a voicemail
   */
  async archive(voicemailId) {
    await this.http.post(this.endpoint(`/voicemails/${voicemailId}/archive`));
  }
  /**
   * Get archived voicemails
   */
  async getArchived() {
    const response = await this.http.get(
      this.endpoint("/voicemails/archived")
    );
    return response;
  }
  /**
   * Download voicemail audio
   */
  async download(voicemailId) {
    const voicemail = await this.get(voicemailId);
    const response = await fetch(voicemail.audioUrl);
    return response.blob();
  }
  /**
   * Get waveform data for visualization
   */
  async getWaveform(voicemailId) {
    const response = await this.http.get(
      this.endpoint(`/voicemails/${voicemailId}/waveform`)
    );
    return response;
  }
  /**
   * Set greeting
   */
  async setGreeting(options) {
    const response = await this.http.post(
      this.endpoint("/voicemails/greeting"),
      {
        text: options.text,
        voice: options.voice,
        duration: options.duration,
        // Audio file would be uploaded separately
        hasAudioFile: !!options.audioFile
      }
    );
    return response;
  }
  /**
   * Get current greeting
   */
  async getGreeting() {
    const response = await this.http.get(
      this.endpoint("/voicemails/greeting")
    );
    return response;
  }
  /**
   * Enable voicemail
   */
  async enable() {
    await this.http.post(
      this.endpoint("/voicemails/settings"),
      { enabled: true }
    );
  }
  /**
   * Disable voicemail
   */
  async disable() {
    await this.http.post(
      this.endpoint("/voicemails/settings"),
      { enabled: false }
    );
  }
  /**
   * Check if voicemail is enabled
   */
  async isEnabled() {
    const response = await this.http.get(
      this.endpoint("/voicemails/settings")
    );
    return response.enabled;
  }
  /**
   * Set notification preferences
   */
  async setNotificationPreferences(preferences) {
    await this.http.post(
      this.endpoint("/voicemails/notifications"),
      preferences
    );
  }
};

// src/services/conference.ts
var ConferenceService = class extends BaseService {
  participantStreams = /* @__PURE__ */ new Map();
  _mediaProvider = null;
  constructor(http) {
    super(http);
  }
  // ── Media Provider ──────────────────────────────────────────────────
  /**
   * Set the active media provider for real-time audio/video.
   * Pass null to detach.
   */
  setMediaProvider(provider) {
    this._mediaProvider = provider;
  }
  /** Get the current media provider, or null if none is set */
  get mediaProvider() {
    return this._mediaProvider;
  }
  /**
   * Connect to the media session for a room.
   * Requires room.mediaToken (returned by the backend join route).
   * This is a separate step from join() so that join() stays isomorphic (REST-only).
   */
  async connectMedia(room, userName, config) {
    if (!this._mediaProvider) {
      throw new Error("No media provider set. Call setMediaProvider() first.");
    }
    if (!room.mediaToken) {
      throw new Error("Room has no mediaToken. Backend may not have HMS integration enabled.");
    }
    await this._mediaProvider.connect(
      {
        authToken: room.mediaToken,
        userName,
        roomId: room.hmsRoomId
      },
      config
    );
  }
  /**
   * Disconnect from the media session.
   * Safe to call even if no provider is set or not connected.
   */
  async disconnectMedia() {
    if (!this._mediaProvider) return;
    try {
      await this._mediaProvider.disconnect();
    } catch (err) {
      console.warn("[Dial SDK] Media disconnect error (non-fatal):", err);
    }
  }
  // ── Room Lifecycle ──────────────────────────────────────────────────
  /**
   * Create a conference room
   */
  async create(options) {
    const response = await this.http.post(
      this.endpoint("/conference/rooms"),
      options
    );
    return response;
  }
  /**
   * Join a conference room by ID.
   * Maps backend field names (token, role) to SDK field names (mediaToken, mediaRole).
   */
  async join(options) {
    const response = await this.http.post(
      this.endpoint(`/conference/rooms/${options.roomId}/join`),
      {
        video: options.video,
        audio: options.audio,
        displayName: options.displayName
      }
    );
    return this.normalizeRoomResponse(response);
  }
  /**
   * Join a conference room by URL.
   * Maps backend field names (token, role) to SDK field names (mediaToken, mediaRole).
   */
  async joinByUrl(options) {
    const response = await this.http.post(
      this.endpoint("/conference/rooms/join-by-url"),
      options
    );
    return this.normalizeRoomResponse(response);
  }
  /**
   * Normalize backend response fields to SDK ConferenceRoom shape.
   * Backend returns `token` and `role`; SDK uses `mediaToken` and `mediaRole`.
   */
  normalizeRoomResponse(response) {
    const { token, role, ...rest } = response;
    return {
      ...rest,
      mediaToken: rest.mediaToken ?? token,
      mediaRole: rest.mediaRole ?? role
    };
  }
  /**
   * Leave a conference room.
   * Also disconnects from media session if a provider is active.
   */
  async leave(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/leave`));
    this.participantStreams.delete(roomId);
    await this.disconnectMedia();
  }
  /**
   * Get participants in a room
   */
  async getParticipants(roomId) {
    const response = await this.http.get(
      this.endpoint(`/conference/rooms/${roomId}/participants`)
    );
    return response;
  }
  /**
   * Get participant's media stream
   */
  getParticipantStream(roomId, participantId) {
    return this.participantStreams.get(`${roomId}:${participantId}`);
  }
  // ── Audio Controls (dual dispatch: REST + media provider) ───────────
  /**
   * Mute your audio
   */
  async muteAudio(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/mute-audio`));
    this._mediaDispatch(() => this._mediaProvider.setLocalAudioEnabled(false));
  }
  /**
   * Unmute your audio
   */
  async unmuteAudio(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/unmute-audio`));
    this._mediaDispatch(() => this._mediaProvider.setLocalAudioEnabled(true));
  }
  /**
   * Mute a specific participant (host only)
   */
  async muteParticipant(roomId, participantId) {
    await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/participants/${participantId}/mute`)
    );
  }
  /**
   * Mute all participants (host only)
   */
  async muteAll(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/mute-all`));
  }
  // ── Video Controls (dual dispatch: REST + media provider) ──────────
  /**
   * Disable your video
   */
  async disableVideo(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/disable-video`));
    this._mediaDispatch(() => this._mediaProvider.setLocalVideoEnabled(false));
  }
  /**
   * Enable your video
   */
  async enableVideo(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/enable-video`));
    this._mediaDispatch(() => this._mediaProvider.setLocalVideoEnabled(true));
  }
  /**
   * Request participant to enable video
   */
  async requestVideo(roomId, participantId) {
    await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/participants/${participantId}/request-video`)
    );
  }
  // ── Screen Sharing (dual dispatch: REST + media provider) ──────────
  /**
   * Start screen share
   */
  async startScreenShare(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/screen-share/start`));
    this._mediaDispatch(() => this._mediaProvider.startScreenShare());
  }
  /**
   * Stop screen share
   */
  async stopScreenShare(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/screen-share/stop`));
    this._mediaDispatch(() => this._mediaProvider.stopScreenShare());
  }
  // ── Recording ───────────────────────────────────────────────────────
  /**
   * Start recording
   */
  async startRecording(roomId) {
    const response = await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/recording/start`)
    );
    return response;
  }
  /**
   * Stop recording
   */
  async stopRecording(roomId) {
    const response = await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/recording/stop`)
    );
    return response;
  }
  /**
   * Get recordings for a room
   */
  async getRecordings(roomId) {
    const response = await this.http.get(
      this.endpoint(`/conference/rooms/${roomId}/recordings`)
    );
    return response;
  }
  // ── In-Room Messaging ───────────────────────────────────────────────
  /**
   * Send message in room
   */
  async sendMessage(roomId, options) {
    const response = await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/messages`),
      options
    );
    return response;
  }
  // ── Layout ──────────────────────────────────────────────────────────
  /**
   * Set room layout
   */
  async setLayout(roomId, layout, options) {
    await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/layout`),
      { layout, ...options }
    );
  }
  // ── Room Management ─────────────────────────────────────────────────
  /**
   * End room (host only)
   */
  async end(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/end`));
  }
  /**
   * Remove participant (host only)
   */
  async removeParticipant(roomId, participantId) {
    await this.http.delete(
      this.endpoint(`/conference/rooms/${roomId}/participants/${participantId}`)
    );
  }
  /**
   * Transfer host role
   */
  async transferHost(roomId, newHostParticipantId) {
    await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/transfer-host`),
      { participantId: newHostParticipantId }
    );
  }
  // ── Breakout Rooms ──────────────────────────────────────────────────
  /**
   * Create breakout rooms
   */
  async createBreakoutRooms(roomId, options) {
    const response = await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/breakout-rooms`),
      options
    );
    return response;
  }
  /**
   * Move participant to breakout room
   */
  async moveToBreakout(roomId, participantId, breakoutRoomId) {
    await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/breakout-rooms/${breakoutRoomId}/move`),
      { participantId }
    );
  }
  /**
   * Close all breakout rooms
   */
  async closeBreakoutRooms(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/breakout-rooms/close`));
  }
  // ── Polls ───────────────────────────────────────────────────────────
  /**
   * Create poll
   */
  async createPoll(roomId, options) {
    const response = await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/polls`),
      options
    );
    return response;
  }
  /**
   * Vote on poll
   */
  async vote(roomId, pollId, optionIndex) {
    await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/polls/${pollId}/vote`),
      { optionIndex }
    );
  }
  /**
   * Get poll results
   */
  async getPollResults(roomId, pollId) {
    const response = await this.http.get(
      this.endpoint(`/conference/rooms/${roomId}/polls/${pollId}/results`)
    );
    return response;
  }
  // ── Hand Raising ────────────────────────────────────────────────────
  /**
   * Raise hand
   */
  async raiseHand(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/raise-hand`));
  }
  /**
   * Lower hand
   */
  async lowerHand(roomId) {
    await this.http.post(this.endpoint(`/conference/rooms/${roomId}/lower-hand`));
  }
  // ── Quality Settings ────────────────────────────────────────────────
  /**
   * Set video quality
   */
  async setVideoQuality(roomId, settings) {
    await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/quality`),
      settings
    );
  }
  /**
   * Enable/disable adaptive quality
   */
  async setAdaptiveQuality(roomId, enabled) {
    await this.http.post(
      this.endpoint(`/conference/rooms/${roomId}/adaptive-quality`),
      { enabled }
    );
  }
  // ── Analytics ───────────────────────────────────────────────────────
  /**
   * Get room statistics
   */
  async getStats(roomId) {
    const response = await this.http.get(
      this.endpoint(`/conference/rooms/${roomId}/stats`)
    );
    return response;
  }
  /**
   * Internal: Set participant stream
   * @internal
   */
  _setParticipantStream(roomId, participantId, stream) {
    this.participantStreams.set(`${roomId}:${participantId}`, stream);
  }
  // ── Private helpers ─────────────────────────────────────────────────
  /**
   * Fire-and-forget media provider call.
   * Logs errors but doesn't throw — REST is the source of truth.
   */
  _mediaDispatch(fn) {
    if (!this._mediaProvider) return;
    fn().catch((err) => {
      console.warn("[Dial SDK] Media provider error (non-fatal):", err);
    });
  }
};
var ContactsBook = class {
  provider;
  emitter = new EventEmitter3__default.default();
  cache = /* @__PURE__ */ new Map();
  loaded = false;
  constructor(provider, config) {
    this.provider = provider;
    if (config?.autoLoad !== false) {
      this.load().catch(() => {
      });
    }
  }
  // ── Read operations ──────────────────────────────────────────────
  /** Load (or reload) all contacts from the provider into cache */
  async load() {
    const contacts = await this.provider.getAll();
    this.cache.clear();
    for (const c of contacts) {
      this.cache.set(c.walletAddress.toLowerCase(), c);
    }
    this.loaded = true;
    this.emit("contacts:loaded", { contacts });
    return contacts;
  }
  /** Get all contacts (from cache if loaded, otherwise loads first) */
  async getAll() {
    if (!this.loaded) await this.load();
    return Array.from(this.cache.values());
  }
  /** Get a single contact by wallet address */
  async get(walletAddress) {
    if (!this.loaded) await this.load();
    return this.cache.get(walletAddress.toLowerCase()) ?? null;
  }
  /** Check if a wallet address is in the contacts book */
  async has(walletAddress) {
    if (!this.loaded) await this.load();
    return this.cache.has(walletAddress.toLowerCase());
  }
  // ── Write operations ─────────────────────────────────────────────
  /** Add a contact */
  async add(options) {
    const contact = await this.provider.add(options);
    this.cache.set(contact.walletAddress.toLowerCase(), contact);
    this.emit("contact:added", { contact });
    return contact;
  }
  /** Update a contact's nickname, tags, or notes */
  async update(options) {
    const contact = await this.provider.update(options);
    this.cache.set(contact.walletAddress.toLowerCase(), contact);
    this.emit("contact:updated", { contact });
    return contact;
  }
  /** Remove a contact */
  async remove(walletAddress) {
    await this.provider.remove(walletAddress);
    this.cache.delete(walletAddress.toLowerCase());
    this.emit("contact:removed", { walletAddress });
  }
  // ── Events ───────────────────────────────────────────────────────
  /** Subscribe to a contacts book event */
  on(event, callback) {
    this.emitter.on(event, callback);
  }
  /** Unsubscribe from a contacts book event */
  off(event, callback) {
    if (callback) {
      this.emitter.off(event, callback);
    } else {
      this.emitter.removeAllListeners(event);
    }
  }
  /** Remove all event listeners */
  removeAllListeners() {
    this.emitter.removeAllListeners();
  }
  emit(event, payload) {
    this.emitter.emit(event, payload);
  }
};

// src/utils/environment.ts
function detectEnvironment() {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return "browser";
  }
  if (typeof process !== "undefined" && process.versions?.node) {
    return "node";
  }
  return "unknown";
}
var ENVIRONMENT = detectEnvironment();
var IS_BROWSER = ENVIRONMENT === "browser";
var IS_NODE = ENVIRONMENT === "node";
var BROWSER_ONLY_FEATURES = [
  "calls.getLocalStream",
  "calls.getRemoteStream",
  "conference.getParticipantStream",
  "conference.startScreenShare",
  "voicemail.download",
  // Uses Blob
  "profile.updateAvatar"
  // Uses File API
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
function getFetch() {
  if (typeof globalThis.fetch !== "undefined") {
    return globalThis.fetch.bind(globalThis);
  }
  throw new Error(
    "[Dial SDK] No fetch implementation found. Please use Node.js 18+ or provide a custom fetch implementation."
  );
}

// src/services/contacts-book-local.ts
var LocalContactsBookProvider = class {
  storageKey;
  cache = /* @__PURE__ */ new Map();
  loaded = false;
  constructor(options) {
    const prefix = options.storagePrefix ?? "dial_contacts";
    this.storageKey = `${prefix}:${options.walletAddress.toLowerCase()}`;
  }
  async getAll() {
    await this.ensureLoaded();
    return Array.from(this.cache.values());
  }
  async get(walletAddress) {
    await this.ensureLoaded();
    return this.cache.get(walletAddress.toLowerCase()) ?? null;
  }
  async add(options) {
    await this.ensureLoaded();
    const key = options.walletAddress.toLowerCase();
    const contact = {
      walletAddress: options.walletAddress,
      profile: {
        walletAddress: options.walletAddress,
        displayName: options.nickname ?? options.walletAddress,
        status: "offline",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      nickname: options.nickname,
      tags: options.tags,
      addedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.cache.set(key, contact);
    this.persist();
    return contact;
  }
  async update(options) {
    await this.ensureLoaded();
    const key = options.walletAddress.toLowerCase();
    const existing = this.cache.get(key);
    if (!existing) {
      throw new NotFoundError(`Contact ${options.walletAddress} not found`);
    }
    const updated = {
      ...existing,
      nickname: options.nickname ?? existing.nickname,
      tags: options.tags ?? existing.tags,
      notes: options.notes ?? existing.notes
    };
    this.cache.set(key, updated);
    this.persist();
    return updated;
  }
  async remove(walletAddress) {
    await this.ensureLoaded();
    this.cache.delete(walletAddress.toLowerCase());
    this.persist();
  }
  async has(walletAddress) {
    await this.ensureLoaded();
    return this.cache.has(walletAddress.toLowerCase());
  }
  // ── Private helpers ──────────────────────────────────────────────
  async ensureLoaded() {
    if (this.loaded) return;
    this.loaded = true;
    if (!IS_BROWSER) return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const contacts = JSON.parse(raw);
        for (const c of contacts) {
          this.cache.set(c.walletAddress.toLowerCase(), c);
        }
      }
    } catch {
      this.cache.clear();
    }
  }
  persist() {
    if (!IS_BROWSER) return;
    try {
      const contacts = Array.from(this.cache.values());
      localStorage.setItem(this.storageKey, JSON.stringify(contacts));
    } catch {
    }
  }
};

// src/client/user-dialer.ts
var UserDialer = class {
  http;
  session;
  events;
  /** @internal */
  authService;
  /**
   * Calls service - wallet-to-wallet audio/video calling
   * 
   * @remarks
   * - `start()`, `answer()`, `decline()`, `end()` - Isomorphic
   * - `getLocalStream()`, `getRemoteStream()` - Browser only
   * 
   * @example
   * ```typescript
   * // Start a video call
   * const call = await userDialer.calls.start({
   *   to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
   *   type: 'video'
   * });
   * ```
   */
  calls;
  /**
   * Chat service - E2EE DMs and Groups
   *
   * @remarks
   * All methods are isomorphic and work in both browser and Node.js.
   * Uses Signal Protocol for DMs and Sender Keys for Groups.
   *
   * @example
   * ```typescript
   * // Send a message
   * await userDialer.chat.send({
   *   to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
   *   content: 'Hello!'
   * });
   *
   * // Create a DM
   * const dm = await userDialer.chat.createDM({
   *   otherDialUserId: '0x...'
   * });
   *
   * // Create a group
   * const group = await userDialer.chat.createGroup({
   *   name: 'My Group',
   *   participants: ['0x...', '0x...']
   * });
   * ```
   */
  chat;
  /**
   * Messages service - wallet-to-wallet messaging
   * @deprecated Use chat instead
   */
  messages;
  /**
   * Profile service - manage user profiles
   * 
   * @remarks
   * All methods are isomorphic except `updateAvatar()` which uses File API.
   * 
   * @example
   * ```typescript
   * // Get current profile
   * const profile = await userDialer.profile.get();
   * ```
   */
  profile;
  /**
   * Voicemail service - manage voicemails
   * 
   * @remarks
   * - `getAll()`, `get()`, `markAsRead()`, `transcribe()` - Isomorphic
   * - `download()` - Browser only (uses Blob)
   * 
   * @example
   * ```typescript
   * // Get all voicemails
   * const voicemails = await userDialer.voicemail.getAll();
   * ```
   */
  voicemail;
  /**
   * Conference service - video conferencing
   *
   * @remarks
   * - Room management methods are isomorphic
   * - Media streaming methods are browser only
   *
   * @example
   * ```typescript
   * // Create a conference room
   * const room = await userDialer.conference.create({
   *   name: 'Team Standup',
   *   maxParticipants: 10
   * });
   * ```
   */
  conference;
  /**
   * Contacts book - manage user contacts
   *
   * @remarks
   * Uses LocalContactsBookProvider by default (localStorage in browser).
   * Supply a custom IContactsBookProvider via `setContactsProvider()` to
   * use API-backed or custom storage.
   *
   * @example
   * ```typescript
   * // Add a contact
   * await userDialer.contacts.add({ walletAddress: '0x...' });
   *
   * // List contacts
   * const contacts = await userDialer.contacts.getAll();
   *
   * // Listen for changes
   * userDialer.contacts.on('contact:added', ({ contact }) => {
   *   console.log('Added:', contact.walletAddress);
   * });
   * ```
   */
  contacts;
  constructor(http, session, contactsProvider, contactsConfig) {
    this.http = http;
    this.session = session;
    this.events = new DialEventEmitter();
    this.http.setAuthToken(session.token);
    this.authService = new AuthService(http);
    this.calls = new CallsService(http);
    this.chat = new ChatService(http);
    this.messages = this.chat;
    this.profile = new ProfileService(http);
    this.voicemail = new VoicemailService(http);
    this.conference = new ConferenceService(http);
    const provider = contactsProvider ?? new LocalContactsBookProvider({
      walletAddress: session.walletAddress
    });
    this.contacts = new ContactsBook(provider, contactsConfig);
  }
  /**
   * Replace the contacts book provider at runtime
   *
   * @example
   * ```typescript
   * import { ApiContactsBookProvider } from '@dial-wtf/sdk';
   * userDialer.setContactsProvider(new ApiContactsBookProvider(httpClient));
   * ```
   */
  setContactsProvider(provider, config) {
    this.contacts.removeAllListeners();
    this.contacts = new ContactsBook(provider, config);
  }
  /**
   * Get the authenticated user's wallet address
   */
  get walletAddress() {
    return this.session.walletAddress;
  }
  /**
   * Check if the session is still valid
   */
  async isSessionValid() {
    return this.authService.validateSession(this.session);
  }
  /**
   * Export session data for persistence
   * 
   * @remarks
   * Store this data securely (e.g., localStorage, secure cookie) to restore sessions later.
   * 
   * @example
   * ```typescript
   * const sessionData = userDialer.exportSession();
   * localStorage.setItem('dial_session', JSON.stringify(sessionData));
   * ```
   */
  exportSession() {
    return { ...this.session };
  }
  /**
   * Logout and invalidate the session
   */
  async logout() {
    await this.authService.logout();
    this.http.setAuthToken(void 0);
    this.events.removeAllListeners();
  }
  /**
   * Subscribe to events
   * 
   * @example
   * ```typescript
   * userDialer.on('call:incoming', (call) => {
   *   console.log('Incoming call from:', call.from);
   * });
   * ```
   */
  on(event, listener) {
    this.events.on(event, listener);
  }
  /**
   * Subscribe to an event (only fires once)
   */
  once(event, listener) {
    this.events.once(event, listener);
  }
  /**
   * Unsubscribe from events
   */
  off(event, listener) {
    this.events.off(event, listener);
  }
  /**
   * Emit an event (internal use)
   * @internal
   */
  _emit(event, payload) {
    this.events.emit(event, payload);
  }
};

// src/client/dial-client.ts
var DialClient = class {
  /** SDK version */
  static version = SDK_VERSION;
  config;
  http;
  /**
   * Authentication service
   *
   * @remarks
   * Isomorphic - works in both browser and Node.js
   *
   * @example
   * ```typescript
   * // Get nonce for SIWE message
   * const nonce = await dial.auth.getNonce();
   * ```
   */
  auth;
  /**
   * Party Lines service - query and create party lines
   *
   * @remarks
   * Isomorphic - works in both browser and Node.js
   * Read operations don't require authentication.
   * Write operations require an API key.
   *
   * @example
   * ```typescript
   * // Get active party lines (no auth required)
   * const partyLines = await dial.partyLines.getActive();
   *
   * // Create party line (requires API key)
   * const room = await dial.partyLines.create({
   *   owner: '0x...',
   *   name: 'My Room'
   * });
   * ```
   */
  partyLines;
  /**
   * Registry service - public registry features
   *
   * @remarks
   * Isomorphic - works in both browser and Node.js
   * No authentication required.
   *
   * @example
   * ```typescript
   * // Search profiles
   * const profiles = await dial.registry.searchProfiles({ query: 'alice' });
   *
   * // Get profile by ENS
   * const profile = await dial.registry.getProfileByENS('alice.eth');
   * ```
   */
  registry;
  /**
   * Create a new DialClient instance
   *
   * @param config - Client configuration options
   */
  constructor(config = {}) {
    this.config = this.resolveConfig(config);
    this.http = new HttpClient(this.config);
    this.auth = new AuthService(this.http);
    this.partyLines = new PartyLinesService(this.http);
    this.registry = new RegistryService(this.http);
  }
  /**
   * Resolve configuration with defaults
   */
  resolveConfig(config) {
    const network = config.network ?? DEFAULT_NETWORK;
    const baseUrl = config.baseUrl ?? API_BASE_URLS[network];
    return {
      apiKey: config.apiKey,
      baseUrl,
      timeout: config.timeout ?? 3e4,
      debug: config.debug ?? false,
      fetch: config.fetch ?? getFetch()
    };
  }
  /**
   * Authenticate and create a user-bound client
   *
   * @remarks
   * Pass either SIWE (Ethereum) or SIWS (Solana) credentials.
   * Returns a UserDialer instance with access to all authenticated features.
   *
   * @example
   * ```typescript
   * // With SIWE (Ethereum)
   * const userDialer = await dial.asUser({
   *   siwe: { message, signature }
   * });
   *
   * // With SIWS (Solana)
   * const userDialer = await dial.asUser({
   *   siws: { message, signature }
   * });
   * ```
   */
  async asUser(credentials) {
    if (!credentials.siwe && !credentials.siws) {
      throw new ValidationError(
        "Either siwe or siws credentials must be provided"
      );
    }
    const authResult = await this.auth.authenticate(credentials);
    return new UserDialer(this.http, authResult.session);
  }
  /**
   * Restore a session from exported session data
   *
   * @remarks
   * Use this to restore a previously authenticated session without
   * requiring the user to sign again.
   *
   * @example
   * ```typescript
   * // Restore from localStorage
   * const sessionData = JSON.parse(localStorage.getItem('dial_session'));
   * const userDialer = await dial.restoreSession(sessionData);
   *
   * // Validate session is still active
   * if (await userDialer.isSessionValid()) {
   *   console.log('Session restored successfully');
   * }
   * ```
   */
  async restoreSession(session) {
    if (!session.walletAddress || !session.token || !session.expiresAt) {
      throw new ValidationError("Invalid session data");
    }
    const expiresAt = new Date(session.expiresAt);
    if (expiresAt <= /* @__PURE__ */ new Date()) {
      throw new ValidationError("Session has expired");
    }
    return new UserDialer(this.http, session);
  }
  /**
   * Simple SIWE authentication helper
   *
   * @remarks
   * Browser only - requires wallet provider.
   * Handles SIWE message creation and signing internally.
   *
   * @example
   * ```typescript
   * // With ethers.js signer
   * const userDialer = await dial.authenticateWithWallet({
   *   wallet: signer,
   *   chainId: 1
   * });
   * ```
   */
  async authenticateWithWallet(options) {
    const address = await options.wallet.getAddress();
    const nonce = await this.auth.getNonce(address);
    const domain = options.domain ?? "dial.wtf";
    const uri = options.uri ?? "https://dial.wtf";
    const issuedAt = (/* @__PURE__ */ new Date()).toISOString();
    const message = [
      `${domain} wants you to sign in with your Ethereum account:`,
      address,
      "",
      "Sign in to Dial",
      "",
      `URI: ${uri}`,
      `Version: 1`,
      `Chain ID: ${options.chainId}`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`
    ].join("\n");
    const signature = await options.wallet.signMessage(message);
    return this.asUser({
      siwe: { message, signature }
    });
  }
  /**
   * Simple SIWS authentication helper for Solana
   *
   * @remarks
   * Browser only - requires Solana wallet adapter.
   *
   * @example
   * ```typescript
   * // With Solana wallet adapter
   * const userDialer = await dial.authenticateWithSolana({
   *   wallet: solanaWallet
   * });
   * ```
   */
  async authenticateWithSolana(options) {
    const address = options.wallet.publicKey.toBase58();
    const nonce = await this.auth.getNonce(address);
    const domain = options.domain ?? "dial.wtf";
    const uri = options.uri ?? "https://dial.wtf";
    const issuedAt = (/* @__PURE__ */ new Date()).toISOString();
    const message = [
      `${domain} wants you to sign in with your Solana account:`,
      address,
      "",
      "Sign in to Dial",
      "",
      `URI: ${uri}`,
      `Version: 1`,
      `Chain ID: mainnet`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`
    ].join("\n");
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await options.wallet.signMessage(messageBytes);
    const signature = this.uint8ArrayToBase58(signatureBytes);
    return this.asUser({
      siws: { message, signature }
    });
  }
  /**
   * Simple base58 encoding for signatures
   * @internal
   */
  uint8ArrayToBase58(bytes) {
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    let num = BigInt(0);
    for (const byte of bytes) {
      num = num * BigInt(256) + BigInt(byte);
    }
    while (num > 0) {
      result = ALPHABET[Number(num % BigInt(58))] + result;
      num = num / BigInt(58);
    }
    for (const byte of bytes) {
      if (byte === 0) {
        result = "1" + result;
      } else {
        break;
      }
    }
    return result;
  }
};

// src/services/contacts-book-api.ts
var ApiContactsBookProvider = class {
  constructor(http, apiVersion = "v1") {
    this.http = http;
    this.apiVersion = apiVersion;
  }
  apiVersion;
  async getAll(params) {
    return this.http.get(
      this.endpoint("/profile/contacts"),
      params ? { ...params } : void 0
    );
  }
  async get(walletAddress) {
    try {
      const contacts = await this.getAll();
      return contacts.find(
        (c) => c.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      ) ?? null;
    } catch {
      return null;
    }
  }
  async add(options) {
    return this.http.post(
      this.endpoint("/profile/contacts"),
      options
    );
  }
  async update(options) {
    return this.http.patch(
      this.endpoint(`/profile/contacts/${options.walletAddress}`),
      options
    );
  }
  async remove(walletAddress) {
    await this.http.delete(
      this.endpoint(`/profile/contacts/${walletAddress}`)
    );
  }
  async has(walletAddress) {
    const contact = await this.get(walletAddress);
    return contact !== null;
  }
  endpoint(path) {
    return `/${this.apiVersion}${path}`;
  }
};

exports.API_BASE_URLS = API_BASE_URLS;
exports.ApiContactsBookProvider = ApiContactsBookProvider;
exports.ApiError = ApiError;
exports.AuthError = AuthError;
exports.BROWSER_ONLY_FEATURES = BROWSER_ONLY_FEATURES;
exports.ContactsBook = ContactsBook;
exports.DEFAULT_NETWORK = DEFAULT_NETWORK;
exports.DialClient = DialClient;
exports.DialError = DialError;
exports.ENVIRONMENT = ENVIRONMENT;
exports.ISOMORPHIC_FEATURES = ISOMORPHIC_FEATURES;
exports.IS_BROWSER = IS_BROWSER;
exports.IS_NODE = IS_NODE;
exports.LocalContactsBookProvider = LocalContactsBookProvider;
exports.NetworkError = NetworkError;
exports.NotFoundError = NotFoundError;
exports.PermissionDeniedError = PermissionDeniedError;
exports.RateLimitError = RateLimitError;
exports.SDK_VERSION = SDK_VERSION;
exports.SessionExpiredError = SessionExpiredError;
exports.TimeoutError = TimeoutError;
exports.UserDialer = UserDialer;
exports.ValidationError = ValidationError;
exports.detectEnvironment = detectEnvironment;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map