/**
 * @file common.ts
 * @description Common types used across all Dial SDK packages.
 * @layer Types
 */
/** Ethereum address format */
type EthAddress = `0x${string}`;
/** Solana address (base58 encoded) */
type SolAddress = string;
/** Wallet address - either Ethereum or Solana */
type WalletAddress = EthAddress | SolAddress;
/** Network types supported by Dial */
type Network = 'mainnet' | 'testnet' | 'devnet' | 'staging' | 'alpha';
/** Chain types supported by Dial */
type Chain = 'ethereum' | 'solana' | 'base' | 'polygon' | 'arbitrum';
/** Timestamp as ISO string */
type Timestamp = string;
/** Pagination parameters */
interface PaginationParams {
    limit?: number;
    offset?: number;
}
/** Pagination info in responses */
interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}
/** Paginated response wrapper */
interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationInfo;
}
/** Standard API response wrapper */
interface ApiResponse<T> {
    success: boolean;
    data: T;
    version?: string;
}
/** Standard API error response */
interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: Record<string, unknown>;
}
/** Media type for messages and attachments */
type MediaType = 'text' | 'image' | 'video' | 'audio' | 'file';
/** Media attachment info */
interface MediaAttachment {
    url: string;
    thumbnailUrl?: string;
    size: number;
    mimeType: string;
    duration?: number;
    width?: number;
    height?: number;
}

/**
 * @file auth.ts
 * @description Authentication types for SIWE/SIWS.
 * @layer Types
 */

/** SIWE (Sign-In with Ethereum) credentials */
interface SiweCredentials {
    message: string;
    signature: string;
}
/** SIWS (Sign-In with Solana) credentials */
interface SiwsCredentials {
    message: string;
    signature: string;
}
/** Authentication credentials - either SIWE or SIWS */
interface AuthCredentials {
    siwe?: SiweCredentials;
    siws?: SiwsCredentials;
}
/** Nonce response from server */
interface NonceResponse {
    nonce: string;
    expiresAt: string;
}
/** Session data for persistence */
interface SessionData {
    walletAddress: WalletAddress;
    token: string;
    refreshToken?: string;
    expiresAt: string;
    chain: 'ethereum' | 'solana';
}
/** Authentication result */
interface AuthResult {
    session: SessionData;
    profile?: {
        walletAddress: WalletAddress;
        displayName?: string;
        avatar?: string;
    };
}

/**
 * @file profile.ts
 * @description Profile types for Dial user profiles.
 * @layer Types
 */

/** Profile status */
type ProfileStatus = 'online' | 'away' | 'busy' | 'offline';
/** Profile visibility */
type ProfileVisibility = 'public' | 'contacts' | 'private';
/** Profile links */
interface ProfileLinks {
    twitter?: string;
    github?: string;
    discord?: string;
    website?: string;
    ens?: string;
    farcaster?: string;
}
/** Notification channel settings */
interface NotificationChannelSettings {
    enabled: boolean;
    sound: boolean;
    vibrate?: boolean;
    showPreview?: boolean;
    mentionsOnly?: boolean;
}
/** Notification settings */
interface NotificationSettings {
    calls: NotificationChannelSettings;
    messages: NotificationChannelSettings;
    groupMessages: NotificationChannelSettings;
    voicemail: NotificationChannelSettings;
}
/** Profile preferences */
interface ProfilePreferences {
    allowCalls: boolean;
    allowMessages: boolean;
    allowGroupInvites: boolean;
    showOnlineStatus: boolean;
    notificationSettings: NotificationSettings;
}
/** Privacy settings */
interface PrivacySettings {
    profileVisibility: ProfileVisibility;
    callPrivacy: ProfileVisibility;
    messagePrivacy: 'everyone' | 'contacts';
    lastSeenVisibility: ProfileVisibility;
}
/** Verified status */
interface VerifiedStatus {
    ens?: boolean;
    twitter?: boolean;
    github?: boolean;
}
/** Dial profile */
interface DialProfile {
    walletAddress: WalletAddress;
    displayName: string;
    avatar?: string;
    bio?: string;
    status: ProfileStatus;
    customStatus?: string;
    links?: ProfileLinks;
    preferences?: ProfilePreferences;
    verified?: VerifiedStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
/** Update profile options */
interface UpdateProfileOptions {
    displayName?: string;
    avatar?: string;
    bio?: string;
    links?: Partial<ProfileLinks>;
}
/** Status with optional message */
interface StatusInfo {
    current: ProfileStatus;
    message?: string;
}
/** Set status options */
interface SetStatusOptions {
    customMessage?: string;
}
/** Contact object */
interface Contact {
    walletAddress: WalletAddress;
    /** Optional chain scope for multi-chain wallets. Omit for a global contact. */
    chainId?: string;
    profile: DialProfile;
    nickname?: string;
    tags?: string[];
    notes?: string;
    addedAt: Timestamp;
}
/** Add contact options */
interface AddContactOptions {
    walletAddress: WalletAddress;
    nickname?: string;
    tags?: string[];
}
/** Update contact options */
interface UpdateContactOptions {
    walletAddress: WalletAddress;
    nickname?: string;
    tags?: string[];
    notes?: string;
}
/** Do not disturb options */
interface DoNotDisturbOptions {
    until?: Timestamp;
    allowContacts?: boolean;
    allowEmergency?: boolean;
}
/** Profile event types */
type ProfileEventType = 'profile:updated' | 'profile:status' | 'profile:contact:added' | 'profile:contact:removed';
/** Profile event payloads */
interface ProfileEventPayloads {
    'profile:updated': DialProfile;
    'profile:status': {
        walletAddress: WalletAddress;
        status: ProfileStatus;
    };
    'profile:contact:added': Contact;
    'profile:contact:removed': {
        walletAddress: WalletAddress;
    };
}

/**
 * @file calls.ts
 * @description Call-related types for wallet-to-wallet calling.
 * @layer Types
 */

/** Call type - audio or video */
type CallType = 'audio' | 'video';
/** Call status */
type CallStatus = 'ringing' | 'active' | 'ended' | 'missed' | 'declined';
/** Decline reason */
type DeclineReason = 'busy' | 'declined' | string;
/** Video quality presets */
type VideoQuality = '360p' | '480p' | '720p' | '1080p';
/** Call object */
interface Call {
    id: string;
    from: WalletAddress;
    to: WalletAddress;
    type: CallType;
    status: CallStatus;
    startedAt?: Timestamp;
    endedAt?: Timestamp;
    duration?: number;
    callerProfile?: DialProfile;
}
/** Start call options */
interface StartCallOptions {
    to: WalletAddress;
    type: CallType;
    video?: {
        resolution?: VideoQuality;
        frameRate?: number;
    };
    adaptiveBitrate?: boolean;
    minBitrate?: number;
    maxBitrate?: number;
}
/** Decline call options */
interface DeclineCallOptions {
    reason?: DeclineReason;
}
/** Call quality metrics */
interface CallQuality {
    score: number;
    latency: number;
    packetLoss: number;
    bitrate: number;
}
/** Call recording result */
interface CallRecording {
    id: string;
    callId: string;
    url: string;
    duration: number;
    size: number;
    createdAt: Timestamp;
}
/** Call event types */
type CallEventType = 'call:incoming' | 'call:answered' | 'call:ended' | 'call:declined' | 'call:missed' | 'call:quality';
/** Call event payloads */
interface CallEventPayloads {
    'call:incoming': Call;
    'call:answered': Call;
    'call:ended': Call;
    'call:declined': Call;
    'call:missed': Call;
    'call:quality': CallQuality;
}

/**
 * @file chats.ts
 * @description Chat types for E2EE DMs and Groups.
 * @layer Types
 */

/** Message status */
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
/** Thread type - DM (1:1) or Group (2+) */
type ThreadType = 'dm' | 'group';
/** Threading model */
type ThreadModel = 'peer' | 'topic';
/** Chat provider */
type ChatProvider = 'sql' | 'matrix' | 'bucket';
/** @deprecated Use ChatProvider instead */
type MessagingProvider = ChatProvider;
/** Reaction on a message */
interface Reaction {
    emoji: string;
    from: WalletAddress;
    timestamp: Timestamp;
}
/** Message object */
interface Message {
    id: string;
    from: WalletAddress;
    to: WalletAddress;
    threadId?: string;
    content: string;
    type: MediaType;
    media?: MediaAttachment;
    timestamp: Timestamp;
    status: MessageStatus;
    reactions?: Reaction[];
    replyTo?: string;
    mentions?: WalletAddress[];
}
/** Send message options */
interface SendMessageOptions {
    to: WalletAddress;
    content?: string;
    type?: MediaType;
    threadId?: string;
    media?: {
        file: File | Blob;
        caption?: string;
        thumbnail?: File | Blob;
        duration?: number;
    };
    provider?: ChatProvider;
    encrypted?: boolean;
    replyTo?: string;
    mentions?: WalletAddress[];
}
/** Conversation object */
interface Conversation {
    id: string;
    participants: WalletAddress[];
    lastMessage: Message;
    unreadCount: number;
    updatedAt: Timestamp;
    threadModel: ThreadModel;
    topic?: string;
}
/** Get conversation options */
interface GetConversationOptions {
    with: WalletAddress;
    threadModel?: ThreadModel;
    provider?: ChatProvider;
}
/** Get messages options */
interface GetMessagesOptions extends PaginationParams {
    with?: WalletAddress;
    threadId?: string;
    before?: Timestamp;
    after?: Timestamp;
}
/** Create thread options */
interface CreateThreadOptions {
    participants: WalletAddress[];
    topic: string;
    threadModel: 'topic';
    provider?: ChatProvider;
}
/** Thread object */
interface Thread {
    id: string;
    type?: ThreadType;
    participants: WalletAddress[];
    topic: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    metadata?: Record<string, unknown>;
}
/** Group object */
interface Group {
    id: string;
    name: string;
    avatar?: string;
    participants: WalletAddress[];
    admins: WalletAddress[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    provider: ChatProvider;
}
/** Create group options */
interface CreateGroupOptions {
    name: string;
    participants: WalletAddress[];
    avatar?: File | Blob;
    provider?: ChatProvider;
}
/** Typing indicator */
interface TypingIndicator {
    from: WalletAddress;
    threadId: string;
    isTyping: boolean;
}
/** Chat event types */
type ChatEventType = 'chat:message:received' | 'chat:message:read' | 'chat:message:deleted' | 'chat:typing:start' | 'chat:typing:stop';
/** Chat event payloads */
interface ChatEventPayloads {
    'chat:message:received': Message;
    'chat:message:read': Message;
    'chat:message:deleted': {
        messageId: string;
    };
    'chat:typing:start': {
        threadId: string;
        from: WalletAddress;
    };
    'chat:typing:stop': {
        threadId: string;
        from: WalletAddress;
    };
}
/** @deprecated Use ChatEventType instead */
type MessageEventType = 'message:received' | 'message:read' | 'message:deleted' | 'typing:start' | 'typing:stop';
/** @deprecated Use ChatEventPayloads instead */
interface MessageEventPayloads {
    'message:received': Message;
    'message:read': Message;
    'message:deleted': {
        messageId: string;
    };
    'typing:start': {
        from: WalletAddress;
    };
    'typing:stop': {
        from: WalletAddress;
    };
}

/**
 * @file voicemail.ts
 * @description Voicemail types.
 * @layer Types
 */

/** Voicemail object */
interface Voicemail {
    id: string;
    from: WalletAddress;
    to: WalletAddress;
    audioUrl: string;
    duration: number;
    timestamp: Timestamp;
    isRead: boolean;
    transcription?: string;
    isArchived?: boolean;
}
/** Start recording options */
interface StartRecordingOptions {
    callId?: string;
    to?: WalletAddress;
    maxDuration?: number;
}
/** Recording in progress */
interface RecordingSession {
    id: string;
    to: WalletAddress;
    startedAt: Timestamp;
    maxDuration: number;
}
/** Get voicemails options */
interface GetVoicemailsOptions extends PaginationParams {
    unreadOnly?: boolean;
}
/** Voicemail greeting */
interface VoicemailGreeting {
    audioUrl: string;
    duration: number;
    createdAt: Timestamp;
}
/** Set greeting options */
interface SetGreetingOptions {
    audioFile?: File | Blob;
    text?: string;
    voice?: string;
    duration?: number;
}
/** Voicemail notification preferences */
interface VoicemailNotificationPreferences {
    push: boolean;
    email: boolean;
    includeTranscription: boolean;
}
/** Transcription result */
interface Transcription {
    text: string;
    confidence: number;
    language: string;
}
/** Waveform data */
interface WaveformData {
    data: number[];
    sampleRate: number;
}
/** Voicemail event types */
type VoicemailEventType = 'voicemail:received' | 'voicemail:transcribed';
/** Voicemail event payloads */
interface VoicemailEventPayloads {
    'voicemail:received': Voicemail;
    'voicemail:transcribed': {
        voicemailId: string;
        transcription: string;
    };
}

/**
 * @file conference.ts
 * @description Video conferencing types for multi-party rooms (HMS-backed).
 * @layer Types
 */

/** Room status */
type RoomStatus = 'waiting' | 'active' | 'ended';
/** Video quality options */
type VideoQualityOption = '360p' | '480p' | '720p' | '1080p';
/** Layout options */
type LayoutOption = 'grid' | 'speaker' | 'spotlight';
/** Conference participant */
interface Participant {
    id: string;
    walletAddress: WalletAddress;
    displayName: string;
    avatar?: string;
    isHost: boolean;
    isMuted: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    joinedAt: Timestamp;
    handRaised?: boolean;
}
/** Recording info */
interface RoomRecording {
    id: string;
    roomId: string;
    isRecording: boolean;
    startedAt?: Timestamp;
    endedAt?: Timestamp;
    url?: string;
    duration?: number;
    size?: number;
}
/** Conference room settings */
interface RoomSettings {
    recordingEnabled: boolean;
    screenShareEnabled: boolean;
    chatEnabled: boolean;
    waitingRoom: boolean;
    muteOnJoin: boolean;
    videoQuality: VideoQualityOption;
}
/** Conference room */
interface ConferenceRoom {
    id: string;
    name: string;
    host: WalletAddress;
    participants: Participant[];
    maxParticipants: number;
    createdAt: Timestamp;
    url: string;
    status: RoomStatus;
    settings: RoomSettings;
    recording?: RoomRecording;
    hmsRoomId?: string;
    roomCode?: string;
    mediaToken?: string;
    mediaRole?: string;
}
/** Create room options */
interface CreateRoomOptions {
    name: string;
    maxParticipants?: number;
    video?: boolean;
    audio?: boolean;
    settings?: Partial<RoomSettings>;
}
/** Join room options */
interface JoinRoomOptions {
    roomId: string;
    video?: boolean;
    audio?: boolean;
    displayName?: string;
}
/** Join by URL options */
interface JoinByUrlOptions {
    url: string;
    video?: boolean;
    audio?: boolean;
    displayName?: string;
}
/** In-room message */
interface RoomMessage {
    id: string;
    roomId: string;
    sender: {
        walletAddress: WalletAddress;
        displayName: string;
        avatar?: string;
    };
    content: string;
    type: MediaType;
    mentions?: WalletAddress[];
    timestamp: Timestamp;
}
/** Send room message options */
interface SendRoomMessageOptions {
    content: string;
    type?: MediaType;
    mentions?: WalletAddress[];
    media?: {
        file: File | Blob;
        caption?: string;
    };
}
/** Breakout room */
interface BreakoutRoom {
    id: string;
    name: string;
    participants: Participant[];
    parentRoomId: string;
}
/** Create breakout rooms options */
interface CreateBreakoutRoomsOptions {
    numberOfRooms: number;
    autoAssign?: boolean;
}
/** Poll option */
interface PollOption {
    index: number;
    text: string;
    votes: number;
    voters: WalletAddress[];
}
/** Poll */
interface Poll {
    id: string;
    roomId: string;
    question: string;
    options: PollOption[];
    duration: number;
    createdAt: Timestamp;
    endsAt: Timestamp;
    isActive: boolean;
}
/** Create poll options */
interface CreatePollOptions {
    question: string;
    options: string[];
    duration?: number;
}
/** Poll results */
interface PollResults {
    poll: Poll;
    totalVotes: number;
    winner?: PollOption;
}
/** Video quality settings */
interface VideoQualitySettings {
    resolution: VideoQualityOption;
    frameRate: number;
    bitrate: number;
}
/** Set layout options */
interface SetLayoutOptions {
    spotlightParticipantId?: string;
}
/** Room statistics */
interface RoomStats {
    duration: number;
    peakParticipants: number;
    messageCount: number;
    networkQuality: number;
}
/** Conference event types */
type ConferenceEventType = 'conference:participant:joined' | 'conference:participant:left' | 'conference:screenshare:started' | 'conference:screenshare:stopped' | 'conference:message' | 'conference:hand:raised' | 'conference:hand:lowered' | 'conference:recording:started' | 'conference:recording:stopped';
/** Conference event payloads */
interface ConferenceEventPayloads {
    'conference:participant:joined': Participant;
    'conference:participant:left': Participant;
    'conference:screenshare:started': {
        participantId: string;
    };
    'conference:screenshare:stopped': {
        participantId: string;
    };
    'conference:message': {
        roomId: string;
        message: RoomMessage;
        sender: Participant;
    };
    'conference:hand:raised': {
        participantId: string;
    };
    'conference:hand:lowered': {
        participantId: string;
    };
    'conference:recording:started': RoomRecording;
    'conference:recording:stopped': RoomRecording;
}

/**
 * @file party-lines.ts
 * @description Party Lines types.
 * @layer Types
 */

/** Party line category */
type PartyLineCategory = 'personal' | 'commercial' | 'community';
/** Party line object */
interface PartyLine {
    id: string;
    name: string;
    description: string;
    roomCode: string;
    joinUrl: string;
    isActive: boolean;
    isPrivate: boolean;
    activeParticipantCount: number;
    maxParticipants: number;
    createdAt: Timestamp;
    lastActivityAt?: Timestamp;
    category: PartyLineCategory;
    videoEnabled: boolean;
    audioOnly: boolean;
}
/** Query party lines options */
interface QueryPartyLinesOptions extends PaginationParams {
    isActive?: boolean;
    search?: string;
}
/** Party lines response */
interface PartyLinesResponse {
    partyLines: PartyLine[];
    pagination: PaginationInfo;
}
/** Create party line options */
interface CreatePartyLineOptions {
    owner: WalletAddress;
    name?: string;
    description?: string;
    isPrivate?: boolean;
    maxParticipants?: number;
    videoEnabled?: boolean;
    audioOnly?: boolean;
    enableChat?: boolean;
    allowScreenShare?: boolean;
    password?: string;
    networkUuid?: string;
    hmsTemplateId?: string;
    hmsRegion?: string;
    telegramUserId?: string;
    telegramChatId?: string;
}
/** Create party line result */
interface CreatePartyLineResult {
    id: string;
    name: string;
    roomCode: string;
    joinUrl: string;
    hmsRoomId: string;
    createdAt: Timestamp;
    owner: WalletAddress;
}

/**
 * @file storage.ts
 * @description Abstract storage interface for platform-agnostic key-value persistence.
 * @layer Interfaces
 *
 * Replaces direct localStorage usage. Consumers can provide implementations for:
 * - Browser: localStorage, IndexedDB
 * - Chrome Extension: chrome.storage.local / chrome.storage.session
 * - Node.js: fs, SQLite
 * - React Native: AsyncStorage
 *
 * Addresses audit finding C3 (localStorage unavailable in extension service worker).
 */
/**
 * Platform-agnostic key-value storage interface.
 *
 * All methods are async to support async backends (chrome.storage, AsyncStorage, etc.).
 */
interface IDialStorage {
    /** Get a value by key. Returns null if not found. */
    getItem(key: string): Promise<string | null>;
    /** Set a value by key. */
    setItem(key: string, value: string): Promise<void>;
    /** Remove a value by key. */
    removeItem(key: string): Promise<void>;
}
/**
 * In-memory storage implementation.
 * Useful as a fallback or for testing.
 */
declare class MemoryStorage implements IDialStorage {
    private readonly store;
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}
/**
 * localStorage-backed storage implementation.
 * Only usable in browser environments with localStorage available.
 */
declare class BrowserStorage implements IDialStorage {
    private get _storage();
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}

/**
 * @file client.ts
 * @description Client configuration types and constants.
 * @layer Types
 */

/** SDK version */
declare const SDK_VERSION = "0.3.0";
/** Default API base URLs */
declare const API_BASE_URLS: Record<Network, string>;
/** Default network */
declare const DEFAULT_NETWORK: Network;
/** Client configuration */
interface DialClientConfig {
    /** API key for authentication */
    apiKey?: string;
    /** Network to connect to (default: alpha) */
    network?: Network;
    /** Custom API base URL (overrides network) */
    baseUrl?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Custom fetch implementation */
    fetch?: typeof fetch;
    /** Custom storage implementation (for extension/non-browser environments) */
    storage?: IDialStorage;
}
/** Resolved client configuration with defaults */
interface ResolvedClientConfig {
    apiKey: string | undefined;
    baseUrl: string;
    timeout: number;
    debug: boolean;
    fetch: typeof fetch;
    storage?: IDialStorage;
}
/** HTTP method types */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
/** Request options */
interface RequestOptions {
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
    signal?: AbortSignal;
}

/**
 * @file media.ts
 * @description Media provider types for real-time audio/video in conference rooms.
 * @layer Types
 *
 * These types define the pluggable media provider abstraction used by
 * ConferenceService for multi-party rooms via HMS (100ms.live).
 * NOT related to 1:1 P2P calls.
 */
/** Platform-agnostic MediaDeviceInfo (mirrors the DOM type for non-browser envs) */
interface DialMediaDeviceInfo {
    deviceId: string;
    groupId: string;
    kind: string;
    label: string;
}
/** Media connection state machine */
type MediaConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
/** A single media track (audio or video) */
interface MediaTrack {
    id: string;
    peerId: string;
    kind: 'audio' | 'video';
    source: 'regular' | 'screen';
    enabled: boolean;
}
/** A peer in the media session */
interface MediaPeer {
    id: string;
    name: string;
    role: string;
    isLocal: boolean;
    audioTrack?: MediaTrack;
    videoTrack?: MediaTrack;
    screenTrack?: MediaTrack;
}
/** Credentials for connecting to a media session */
interface MediaSessionCredentials {
    authToken: string;
    userName: string;
    roomId?: string;
}
/** Configuration for media provider connection */
interface MediaProviderConfig {
    initialAudio?: boolean;
    initialVideo?: boolean;
    videoSettings?: {
        width?: number;
        height?: number;
        frameRate?: number;
        facingMode?: 'user' | 'environment';
    };
}
/** Event map for media provider */
interface MediaProviderEvents {
    'connection-state-changed': {
        state: MediaConnectionState;
    };
    'peer-joined': {
        peer: MediaPeer;
    };
    'peer-left': {
        peer: MediaPeer;
    };
    'peer-updated': {
        peer: MediaPeer;
    };
    'track-added': {
        track: MediaTrack;
        peer: MediaPeer;
    };
    'track-removed': {
        track: MediaTrack;
        peer: MediaPeer;
    };
    'track-updated': {
        track: MediaTrack;
        peer: MediaPeer;
    };
    'error': {
        code: string;
        message: string;
    };
}
/**
 * Pluggable media provider interface.
 *
 * Implement this for any WebRTC SFU provider (HMS, LiveKit, Twilio, etc.).
 */
interface IMediaProvider {
    connect(credentials: MediaSessionCredentials, config?: MediaProviderConfig): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionState(): MediaConnectionState;
    setLocalAudioEnabled(enabled: boolean): Promise<void>;
    setLocalVideoEnabled(enabled: boolean): Promise<void>;
    startScreenShare(): Promise<void>;
    stopScreenShare(): Promise<void>;
    getPeers(): MediaPeer[];
    getLocalPeer(): MediaPeer | null;
    getAudioDevices(): Promise<DialMediaDeviceInfo[]>;
    getVideoDevices(): Promise<DialMediaDeviceInfo[]>;
    setAudioDevice(deviceId: string): Promise<void>;
    setVideoDevice(deviceId: string): Promise<void>;
    on<K extends keyof MediaProviderEvents>(event: K, callback: (payload: MediaProviderEvents[K]) => void): void;
    off<K extends keyof MediaProviderEvents>(event: K, callback: (payload: MediaProviderEvents[K]) => void): void;
}

/**
 * @file contacts-book.ts
 * @description Types for the pluggable ContactsBook abstraction.
 * @layer Types
 */

/** Event map for contacts book */
interface ContactsBookEvents {
    'contact:added': {
        contact: Contact;
    };
    'contact:updated': {
        contact: Contact;
    };
    'contact:removed': {
        walletAddress: WalletAddress;
    };
    'contacts:loaded': {
        contacts: Contact[];
    };
    'error': {
        code: string;
        message: string;
    };
}
/** Configuration for contacts book */
interface ContactsBookConfig {
    storagePrefix?: string;
    autoLoad?: boolean;
}
/**
 * Pluggable contacts book provider interface.
 *
 * Implement this for any storage backend (localStorage, IndexedDB, REST API,
 * chrome.storage, etc.).
 */
interface IContactsBookProvider {
    getAll(): Promise<Contact[]>;
    get(walletAddress: WalletAddress): Promise<Contact | null>;
    add(options: AddContactOptions): Promise<Contact>;
    update(options: UpdateContactOptions): Promise<Contact>;
    remove(walletAddress: WalletAddress): Promise<void>;
    has(walletAddress: WalletAddress): Promise<boolean>;
}

/**
 * @file events.ts
 * @description Event types - combines all SDK events.
 * @layer Types
 */

/** All SDK event types */
type DialEventType = CallEventType | ChatEventType | MessageEventType | ProfileEventType | VoicemailEventType | ConferenceEventType;
/** All SDK event payloads */
type DialEventPayloads = CallEventPayloads & ChatEventPayloads & MessageEventPayloads & ProfileEventPayloads & VoicemailEventPayloads & ConferenceEventPayloads;
/** Event listener function type */
type EventListener<T extends DialEventType> = (payload: DialEventPayloads[T]) => void;
/** Event emitter interface */
interface DialEventEmitterInterface {
    on<T extends DialEventType>(event: T, listener: EventListener<T>): void;
    off<T extends DialEventType>(event: T, listener?: EventListener<T>): void;
    emit<T extends DialEventType>(event: T, payload: DialEventPayloads[T]): void;
    once<T extends DialEventType>(event: T, listener: EventListener<T>): void;
}

/**
 * @file errors.ts
 * @description Dial SDK error hierarchy.
 * @layer Core
 */
/** Base SDK error */
declare class DialError extends Error {
    readonly code: string;
    readonly statusCode: number | undefined;
    readonly details: Record<string, unknown> | undefined;
    constructor(message: string, code: string, statusCode?: number, details?: Record<string, unknown>);
    toJSON(): Record<string, unknown>;
}
/** Authentication error */
declare class AuthError extends DialError {
    constructor(message: string, code?: string, details?: Record<string, unknown>);
}
/** API request error */
declare class ApiError extends DialError {
    constructor(message: string, statusCode: number, code?: string, details?: Record<string, unknown>);
    static fromResponse(status: number, body: unknown): ApiError;
}
/** Network/connection error */
declare class NetworkError extends DialError {
    constructor(message: string, details?: Record<string, unknown>);
}
/** Timeout error */
declare class TimeoutError extends DialError {
    constructor(message?: string);
}
/** Validation error */
declare class ValidationError extends DialError {
    readonly field: string | undefined;
    constructor(message: string, field?: string, details?: Record<string, unknown>);
}
/** Rate limit error */
declare class RateLimitError extends DialError {
    readonly retryAfter: number | undefined;
    constructor(message?: string, retryAfter?: number);
}
/** Session expired error */
declare class SessionExpiredError extends AuthError {
    constructor();
}
/** Not found error */
declare class NotFoundError extends DialError {
    constructor(message: string, resourceType?: string);
}
/** Permission denied error */
declare class PermissionDeniedError extends DialError {
    constructor(message?: string, requiredPermission?: string);
}

/**
 * @file transport.ts
 * @description Abstract HTTP transport interface.
 * @layer Interfaces
 *
 * Defines what an HTTP client must look like so that services can be
 * used with any transport implementation (fetch, undici, extension background, etc.).
 */

/**
 * Abstract HTTP transport interface.
 *
 * The client package provides the default fetch-based implementation.
 * Consumers can provide custom implementations for special environments.
 */
interface IHttpTransport {
    /** Make a typed HTTP request */
    request<T>(endpoint: string, options?: RequestOptions): Promise<T>;
    /** GET request */
    get<T>(endpoint: string, params?: Record<string, unknown>, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    /** POST request */
    post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    /** PUT request */
    put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    /** PATCH request */
    patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    /** DELETE request */
    delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    /** Set the authentication token */
    setAuthToken(token: string | undefined): void;
    /** Get the current auth token */
    getAuthToken(): string | undefined;
}

/**
 * @file operations.ts
 * @description Canonical operations protocol for the Dial SDK.
 * @layer Interfaces
 *
 * IDialOperations is the composite interface that every platform SDK
 * (TypeScript, Swift, Kotlin, Rust, C++) must implement. Native SDK
 * teams use this as their conformance spec.
 *
 * Each sub-interface defines one domain (auth, calls, chat, etc.) and
 * can be implemented independently. The composite bundles them all.
 */

/** Authentication operations — SIWE/SIWS sign-in and session management. */
interface IAuthOperations {
    /** Authenticate with signed SIWE or SIWS credentials. */
    authenticate(credentials: AuthCredentials): Promise<SessionData>;
    /** Restore a previously authenticated session. */
    restoreSession(session: SessionData): Promise<SessionData>;
    /** End the current session. */
    signOut(): Promise<void>;
    /** Get the current session (null if not authenticated). */
    getSession(): SessionData | null;
}
/** Profile operations — read and update user profiles. */
interface IProfileOperations {
    /** Get a profile by address (own profile if omitted). */
    getProfile(address?: WalletAddress): Promise<DialProfile>;
    /** Update the authenticated user's profile. */
    updateProfile(updates: Partial<DialProfile>): Promise<DialProfile>;
    /** Update the authenticated user's avatar (raw bytes). */
    updateAvatar(data: Uint8Array): Promise<DialProfile>;
    /** Search profiles by name, ENS, or address. */
    searchProfiles(query: string): Promise<DialProfile[]>;
}
/** Call operations — 1:1 wallet-to-wallet audio/video calling. */
interface ICallOperations {
    /** Start an outbound call. */
    startCall(options: StartCallOptions): Promise<Call>;
    /** End an active call. */
    endCall(callId: string): Promise<void>;
    /** Answer an incoming call. */
    answerCall(callId: string): Promise<void>;
    /** Decline an incoming call. */
    declineCall(callId: string): Promise<void>;
    /** Set mute state for the active call. */
    setMuted(muted: boolean): Promise<void>;
    /** Set video enabled state for the active call. */
    setVideoEnabled(enabled: boolean): Promise<void>;
    /** Get call history. */
    getCallHistory(options?: PaginationParams): Promise<Call[]>;
    /** Get a single call by ID. */
    getCall(callId: string): Promise<Call>;
}
/** Chat operations — messaging, threads, and groups. */
interface IChatOperations {
    /** Get all threads for the authenticated user. */
    getThreads(): Promise<Thread[]>;
    /** Get a single thread by ID. */
    getThread(threadId: string): Promise<Thread>;
    /** Create a new thread with the given participants. */
    createThread(participants: WalletAddress[], topic?: string): Promise<Thread>;
    /** Send a message to a thread or address. */
    sendMessage(to: WalletAddress | string, content: string, options?: SendMessageOptions): Promise<Message>;
    /** Get messages in a thread. */
    getMessages(threadId: string, options?: PaginationParams): Promise<Message[]>;
    /** Mark all messages in a thread as read. */
    markRead(threadId: string): Promise<void>;
    /** Create a group chat. */
    createGroup(options: CreateGroupOptions): Promise<Thread>;
    /** Add a member to a group thread. */
    addGroupMember(threadId: string, address: WalletAddress): Promise<void>;
    /** Remove a member from a group thread. */
    removeGroupMember(threadId: string, address: WalletAddress): Promise<void>;
}
/** Conference operations — multi-party video rooms backed by an SFU. */
interface IConferenceOperations {
    /** Create a new conference room. */
    createRoom(options: CreateRoomOptions): Promise<ConferenceRoom>;
    /** Join an existing room. */
    joinRoom(roomId: string): Promise<ConferenceRoom>;
    /** Leave a room. */
    leaveRoom(roomId: string): Promise<void>;
    /** End a room (host-only). */
    endRoom(roomId: string): Promise<void>;
    /** Get room details. */
    getRoom(roomId: string): Promise<ConferenceRoom>;
    /** Mute a participant (host-only). */
    muteParticipant(roomId: string, participantId: string): Promise<void>;
    /** Remove a participant from a room (host-only). */
    removeParticipant(roomId: string, participantId: string): Promise<void>;
}
/** Voicemail operations — inbox management. */
interface IVoicemailOperations {
    /** Get all voicemails. */
    getVoicemails(options?: PaginationParams): Promise<Voicemail[]>;
    /** Get a single voicemail by ID. */
    getVoicemail(id: string): Promise<Voicemail>;
    /** Mark a voicemail as read. */
    markRead(id: string): Promise<void>;
    /** Delete a voicemail. */
    deleteVoicemail(id: string): Promise<void>;
    /** Get transcription for a voicemail. */
    getTranscription(id: string): Promise<Transcription>;
    /** Download voicemail audio (platform-agnostic raw bytes). */
    downloadAudio(id: string): Promise<Uint8Array>;
}
/** Contacts operations — address book management. */
interface IContactsOperations {
    /** Get all contacts. */
    getContacts(): Promise<Contact[]>;
    /** Get a single contact by address. */
    getContact(address: WalletAddress): Promise<Contact | null>;
    /** Add a new contact. */
    addContact(options: AddContactOptions): Promise<Contact>;
    /** Update an existing contact. */
    updateContact(options: UpdateContactOptions): Promise<Contact>;
    /** Remove a contact. */
    removeContact(address: WalletAddress): Promise<void>;
    /** Check if an address is in contacts. */
    hasContact(address: WalletAddress): Promise<boolean>;
}
/** Party line operations — public/discoverable audio rooms. */
interface IPartyLineOperations {
    /** Get available party lines. */
    getPartyLines(options?: PaginationParams): Promise<PartyLine[]>;
    /** Get a single party line by ID. */
    getPartyLine(id: string): Promise<PartyLine>;
    /** Create a new party line. */
    createPartyLine(options: CreatePartyLineOptions): Promise<PartyLine>;
}
/** Registry operations — profile lookup and search. */
interface IRegistryOperations {
    /** Look up a profile by wallet address. */
    lookup(address: WalletAddress): Promise<DialProfile | null>;
    /** Look up multiple profiles by address. */
    lookupMany(addresses: WalletAddress[]): Promise<Map<WalletAddress, DialProfile>>;
    /** Search profiles by query string. */
    search(query: string): Promise<DialProfile[]>;
}
/**
 * The canonical Dial operations interface.
 *
 * Every platform SDK (TypeScript, Swift, Kotlin, Rust, C++) exposes this shape
 * (or an appropriate subset). Native SDKs implement these interfaces in their
 * own language idioms.
 */
interface IDialOperations {
    auth: IAuthOperations;
    profile: IProfileOperations;
    calls: ICallOperations;
    chat: IChatOperations;
    conference: IConferenceOperations;
    voicemail: IVoicemailOperations;
    contacts: IContactsOperations;
    partyLines: IPartyLineOperations;
    registry: IRegistryOperations;
}

/**
 * @file environment.ts
 * @description Environment detection utilities with extension support.
 * @layer Utils
 *
 * Addresses audit finding C2: environment detection now correctly identifies
 * Chrome extension service workers and content scripts.
 */
/** Environment type — now includes 'extension' for browser extensions (MV3) */
type Environment = 'browser' | 'node' | 'extension' | 'unknown';
/**
 * Detect the current runtime environment.
 *
 * Detection order matters:
 * 1. Chrome/browser extension (service worker or content script)
 * 2. Standard browser (window + document)
 * 3. Node.js
 * 4. Unknown
 */
declare function detectEnvironment(): Environment;
/** Current environment (cached) */
declare const ENVIRONMENT: Environment;
/** Check if running in browser */
declare const IS_BROWSER: boolean;
/** Check if running in Node.js */
declare const IS_NODE: boolean;
/** Check if running in a browser extension */
declare const IS_EXTENSION: boolean;
/** Check if running in a browser-like environment (browser or extension) */
declare const IS_BROWSER_LIKE: boolean;
/** Features that are only available in browser environment */
declare const BROWSER_ONLY_FEATURES: readonly ["calls.getLocalStream", "calls.getRemoteStream", "conference.getParticipantStream", "conference.startScreenShare", "voicemail.download", "profile.updateAvatar"];
/** Features that work in all environments (isomorphic) */
declare const ISOMORPHIC_FEATURES: readonly ["auth.*", "profile.*", "messages.*", "calls.start", "calls.answer", "calls.decline", "calls.end", "calls.mute", "calls.unmute", "calls.getHistory", "voicemail.getAll", "voicemail.get", "voicemail.markAsRead", "voicemail.transcribe", "conference.create", "conference.join", "conference.leave", "conference.getParticipants", "partyLines.*", "registry.*"];
/** Assert that code is running in browser environment */
declare function assertBrowser(feature: string): void;
/** Assert that code is running in Node.js environment */
declare function assertNode(feature: string): void;
/** Get a cross-platform fetch implementation */
declare function getFetch(): typeof fetch;
/** Log a warning about browser-only feature usage */
declare function warnBrowserOnly(feature: string): void;

export { API_BASE_URLS, type AddContactOptions, ApiError, type ApiErrorResponse, type ApiResponse, type AuthCredentials, AuthError, type AuthResult, BROWSER_ONLY_FEATURES, type BreakoutRoom, BrowserStorage, type Call, type CallEventPayloads, type CallEventType, type CallQuality, type CallRecording, type CallStatus, type CallType, type Chain, type ChatEventPayloads, type ChatEventType, type ChatProvider, type ConferenceEventPayloads, type ConferenceEventType, type ConferenceRoom, type Contact, type ContactsBookConfig, type ContactsBookEvents, type Conversation, type CreateBreakoutRoomsOptions, type CreateGroupOptions, type CreatePartyLineOptions, type CreatePartyLineResult, type CreatePollOptions, type CreateRoomOptions, type CreateThreadOptions, DEFAULT_NETWORK, type DeclineCallOptions, type DeclineReason, type DialClientConfig, DialError, type DialEventEmitterInterface, type DialEventPayloads, type DialEventType, type DialMediaDeviceInfo, type DialProfile, type DoNotDisturbOptions, ENVIRONMENT, type Environment, type EthAddress, type EventListener, type GetConversationOptions, type GetMessagesOptions, type GetVoicemailsOptions, type Group, type HttpMethod, type IAuthOperations, type ICallOperations, type IChatOperations, type IConferenceOperations, type IContactsBookProvider, type IContactsOperations, type IDialOperations, type IDialStorage, type IHttpTransport, type IMediaProvider, type IPartyLineOperations, type IProfileOperations, type IRegistryOperations, ISOMORPHIC_FEATURES, IS_BROWSER, IS_BROWSER_LIKE, IS_EXTENSION, IS_NODE, type IVoicemailOperations, type JoinByUrlOptions, type JoinRoomOptions, type LayoutOption, type MediaAttachment, type MediaConnectionState, type MediaPeer, type MediaProviderConfig, type MediaProviderEvents, type MediaSessionCredentials, type MediaTrack, type MediaType, MemoryStorage, type Message, type MessageEventPayloads, type MessageEventType, type MessageStatus, type MessagingProvider, type Network, NetworkError, type NonceResponse, NotFoundError, type NotificationChannelSettings, type NotificationSettings, type PaginatedResponse, type PaginationInfo, type PaginationParams, type Participant, type PartyLine, type PartyLineCategory, type PartyLinesResponse, PermissionDeniedError, type Poll, type PollOption, type PollResults, type PrivacySettings, type ProfileEventPayloads, type ProfileEventType, type ProfileLinks, type ProfilePreferences, type ProfileStatus, type ProfileVisibility, type QueryPartyLinesOptions, RateLimitError, type Reaction, type RecordingSession, type RequestOptions, type ResolvedClientConfig, type RoomMessage, type RoomRecording, type RoomSettings, type RoomStats, type RoomStatus, SDK_VERSION, type SendMessageOptions, type SendRoomMessageOptions, type SessionData, SessionExpiredError, type SetGreetingOptions, type SetLayoutOptions, type SetStatusOptions, type SiweCredentials, type SiwsCredentials, type SolAddress, type StartCallOptions, type StartRecordingOptions, type StatusInfo, type Thread, type ThreadModel, type ThreadType, TimeoutError, type Timestamp, type Transcription, type TypingIndicator, type UpdateContactOptions, type UpdateProfileOptions, ValidationError, type VerifiedStatus, type VideoQuality, type VideoQualityOption, type VideoQualitySettings, type Voicemail, type VoicemailEventPayloads, type VoicemailEventType, type VoicemailGreeting, type VoicemailNotificationPreferences, type WalletAddress, type WaveformData, assertBrowser, assertNode, detectEnvironment, getFetch, warnBrowserOnly };
