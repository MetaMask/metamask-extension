export { IMediaProvider, MediaConnectionState, MediaPeer, MediaProviderConfig, MediaProviderEvents, MediaSessionCredentials, MediaTrack } from '../media/index.js';

/**
 * Common types used across the Dial SDK
 */
/** Ethereum address format */
type EthAddress = `0x${string}`;
/** Solana address (base58 encoded) */
type SolAddress = string;
/** Wallet address - either Ethereum or Solana */
type WalletAddress = EthAddress | SolAddress;
/** Network types supported by Dial */
type Network = 'mainnet' | 'testnet' | 'devnet';
/** Chain types supported by Dial */
type Chain = 'ethereum' | 'solana' | 'base' | 'polygon' | 'arbitrum';
/** Timestamp as ISO string or Date */
type Timestamp = string | Date;
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
 * Authentication types for SIWE/SIWS
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
 * Profile types for Dial user profiles
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
 * Call-related types for wallet-to-wallet calling
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
 * Chat types for E2EE DMs and Groups
 *
 * @see specs/04-chats.md for full specification
 * @see specs/04a-chats-architecture.md for provider details
 */

/** Message status */
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
/** Thread type - DM (1:1) or Group (2+) */
type ThreadType = 'dm' | 'group';
/** Threading model */
type ThreadModel = 'peer' | 'topic';
/**
 * Chat provider
 * - sql: Phase 1 SQL ciphertext store (default)
 * - matrix: Phase 2 Matrix substrate
 * - bucket: Legacy object storage
 */
type ChatProvider = 'sql' | 'matrix' | 'bucket';
/**
 * Messaging provider (legacy alias for ChatProvider)
 * @deprecated Use ChatProvider instead
 */
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
/** Conversation object (thread with metadata) */
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
/**
 * Legacy message event types
 * @deprecated Use ChatEventType instead
 */
type MessageEventType = 'message:received' | 'message:read' | 'message:deleted' | 'typing:start' | 'typing:stop';
/**
 * Legacy message event payloads
 * @deprecated Use ChatEventPayloads instead
 */
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
 * Voicemail types
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
/** Set greeting options - either audio file or text-to-speech */
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
 *
 * NOTE: These types are for multi-party conference rooms and party lines,
 * which use HMS (100ms.live) as the media provider via an SFU architecture.
 * 1:1 P2P calls use PeerJS — see types/calls.ts for those types.
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
    /** HMS room ID — returned by backend when HMS integration is active */
    hmsRoomId?: string;
    /** HMS room code for joining via short code */
    roomCode?: string;
    /** HMS auth token for media connection — returned by backend join route */
    mediaToken?: string;
    /** HMS role assignment (e.g. 'host', 'guest') */
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
 * Party Lines types - matching the PeerSpeak v1 API
 */

/** Party line category */
type PartyLineCategory = 'personal' | 'commercial' | 'community';
/** Party line object (matches OpenAPI spec) */
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
 * Client configuration types
 */

/** SDK version */
declare const SDK_VERSION = "0.3.0";
/** Default API base URLs */
declare const API_BASE_URLS: Record<Network | 'staging' | 'alpha', string>;
/** Default network */
declare const DEFAULT_NETWORK: Network | 'alpha';
/** Client configuration */
interface DialClientConfig {
    /** API key for authentication */
    apiKey?: string;
    /** Network to connect to (default: alpha) */
    network?: Network | 'staging' | 'alpha';
    /** Custom API base URL (overrides network) */
    baseUrl?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Custom fetch implementation */
    fetch?: typeof fetch;
}
/** Resolved client configuration with defaults */
interface ResolvedClientConfig {
    apiKey: string | undefined;
    baseUrl: string;
    timeout: number;
    debug: boolean;
    fetch: typeof fetch;
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
 * @file contacts-book.ts
 * @description Types for the pluggable ContactsBook abstraction.
 * @layer Types
 *
 * Defines the IContactsBookProvider interface and associated config/events.
 * Follows the same pluggable-provider pattern as IMediaProvider.
 */

/** Event map for contacts book — subscribe via contactsBook.on() */
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
/** Configuration for contacts book initialisation */
interface ContactsBookConfig {
    /** Storage key prefix for local providers (default: 'dial_contacts') */
    storagePrefix?: string;
    /** Auto-load contacts on creation (default: true) */
    autoLoad?: boolean;
}
/**
 * Pluggable contacts book provider interface.
 *
 * Implement this for any storage backend (localStorage, IndexedDB, REST API, etc.).
 * The ContactsBook class delegates CRUD operations to this interface while providing
 * a unified event-driven API to consumers.
 */
interface IContactsBookProvider {
    /** Load all contacts from the backing store */
    getAll(): Promise<Contact[]>;
    /** Retrieve a single contact by wallet address, or null if not found */
    get(walletAddress: WalletAddress): Promise<Contact | null>;
    /** Add a new contact. Returns the persisted Contact object. */
    add(options: AddContactOptions): Promise<Contact>;
    /** Update an existing contact. Returns the updated Contact object. */
    update(options: UpdateContactOptions): Promise<Contact>;
    /** Remove a contact by wallet address */
    remove(walletAddress: WalletAddress): Promise<void>;
    /** Check whether a wallet address is already in the contacts book */
    has(walletAddress: WalletAddress): Promise<boolean>;
}

/**
 * Event types - combines all SDK events
 */

/** All SDK event types */
type DialEventType = CallEventType | ChatEventType | MessageEventType | ProfileEventType | VoicemailEventType | ConferenceEventType;
/** All SDK event payloads */
type DialEventPayloads = CallEventPayloads & ChatEventPayloads & MessageEventPayloads & ProfileEventPayloads & VoicemailEventPayloads & ConferenceEventPayloads;
/** Event listener function type */
type EventListener<T extends DialEventType> = (payload: DialEventPayloads[T]) => void;
/** Event emitter interface */
interface DialEventEmitter {
    on<T extends DialEventType>(event: T, listener: EventListener<T>): void;
    off<T extends DialEventType>(event: T, listener?: EventListener<T>): void;
    emit<T extends DialEventType>(event: T, payload: DialEventPayloads[T]): void;
    once<T extends DialEventType>(event: T, listener: EventListener<T>): void;
}

export { API_BASE_URLS, type AddContactOptions, type ApiErrorResponse, type ApiResponse, type AuthCredentials, type AuthResult, type BreakoutRoom, type Call, type CallEventPayloads, type CallEventType, type CallQuality, type CallRecording, type CallStatus, type CallType, type Chain, type ChatEventPayloads, type ChatEventType, type ChatProvider, type ConferenceEventPayloads, type ConferenceEventType, type ConferenceRoom, type Contact, type ContactsBookConfig, type ContactsBookEvents, type Conversation, type CreateBreakoutRoomsOptions, type CreateGroupOptions, type CreatePartyLineOptions, type CreatePartyLineResult, type CreatePollOptions, type CreateRoomOptions, type CreateThreadOptions, DEFAULT_NETWORK, type DeclineCallOptions, type DeclineReason, type DialClientConfig, type DialEventEmitter, type DialEventPayloads, type DialEventType, type DialProfile, type DoNotDisturbOptions, type EthAddress, type EventListener, type GetConversationOptions, type GetMessagesOptions, type GetVoicemailsOptions, type Group, type HttpMethod, type IContactsBookProvider, type JoinByUrlOptions, type JoinRoomOptions, type LayoutOption, type MediaAttachment, type MediaType, type Message, type MessageEventPayloads, type MessageEventType, type MessageStatus, type MessagingProvider, type Network, type NonceResponse, type NotificationChannelSettings, type NotificationSettings, type PaginatedResponse, type PaginationInfo, type PaginationParams, type Participant, type PartyLine, type PartyLineCategory, type PartyLinesResponse, type Poll, type PollOption, type PollResults, type PrivacySettings, type ProfileEventPayloads, type ProfileEventType, type ProfileLinks, type ProfilePreferences, type ProfileStatus, type ProfileVisibility, type QueryPartyLinesOptions, type Reaction, type RecordingSession, type RequestOptions, type ResolvedClientConfig, type RoomMessage, type RoomRecording, type RoomSettings, type RoomStats, type RoomStatus, SDK_VERSION, type SendMessageOptions, type SendRoomMessageOptions, type SessionData, type SetGreetingOptions, type SetLayoutOptions, type SetStatusOptions, type SiweCredentials, type SiwsCredentials, type SolAddress, type StartCallOptions, type StartRecordingOptions, type StatusInfo, type Thread, type ThreadModel, type ThreadType, type Timestamp, type Transcription, type TypingIndicator, type UpdateContactOptions, type UpdateProfileOptions, type VerifiedStatus, type VideoQuality, type VideoQualityOption, type VideoQualitySettings, type Voicemail, type VoicemailEventPayloads, type VoicemailEventType, type VoicemailGreeting, type VoicemailNotificationPreferences, type WalletAddress, type WaveformData };
