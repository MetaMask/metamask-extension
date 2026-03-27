import { ResolvedClientConfig, RequestOptions, WalletAddress, AuthResult, AuthCredentials, SessionData, QueryPartyLinesOptions, PartyLinesResponse, PartyLine, CreatePartyLineOptions, CreatePartyLineResult, PaginationParams, ConferenceRoom, DialProfile, StartCallOptions, Call, DeclineCallOptions, CallRecording, SendMessageOptions, Message, Conversation, GetConversationOptions, GetMessagesOptions, Thread, CreateThreadOptions, CreateGroupOptions, Group, UpdateProfileOptions, ProfileStatus, SetStatusOptions, StatusInfo, ProfilePreferences, PrivacySettings, NotificationSettings, DoNotDisturbOptions, AddContactOptions, Contact, UpdateContactOptions, StartRecordingOptions, RecordingSession, Voicemail, GetVoicemailsOptions, Transcription, WaveformData, SetGreetingOptions, VoicemailGreeting, VoicemailNotificationPreferences, CreateRoomOptions, JoinRoomOptions, JoinByUrlOptions, Participant, RoomRecording, SendRoomMessageOptions, RoomMessage, LayoutOption, SetLayoutOptions, CreateBreakoutRoomsOptions, BreakoutRoom, CreatePollOptions, Poll, PollResults, VideoQualitySettings, RoomStats, IContactsBookProvider, ContactsBookConfig, ContactsBookEvents, DialEventType, EventListener, DialClientConfig } from './types/index.cjs';
export { API_BASE_URLS, ApiErrorResponse, ApiResponse, CallQuality, CallStatus, CallType, Chain, DEFAULT_NETWORK, DeclineReason, DialEventPayloads, EthAddress, MediaAttachment, MediaType, MessageStatus, MessagingProvider, Network, NonceResponse, NotificationChannelSettings, PaginatedResponse, PaginationInfo, PartyLineCategory, PollOption, ProfileLinks, ProfileVisibility, Reaction, RoomSettings, RoomStatus, SDK_VERSION, SiweCredentials, SiwsCredentials, SolAddress, ThreadModel, Timestamp, TypingIndicator, VerifiedStatus, VideoQuality, VideoQualityOption } from './types/index.cjs';
import { IMediaProvider, MediaProviderConfig } from './media/index.cjs';
export { MediaConnectionState, MediaPeer, MediaProviderEvents, MediaSessionCredentials, MediaTrack } from './media/index.cjs';

/**
 * HTTP Client for Dial API
 */

/** HTTP client for making API requests */
declare class HttpClient {
    private readonly config;
    private authToken?;
    constructor(config: ResolvedClientConfig);
    /** Set the authentication token for requests */
    setAuthToken(token: string | undefined): void;
    /** Get the current auth token */
    getAuthToken(): string | undefined;
    /** Build full URL for an endpoint */
    private buildUrl;
    /** Build request headers */
    private buildHeaders;
    /** Make an HTTP request */
    request<T>(endpoint: string, options?: RequestOptions): Promise<T>;
    /** Handle error responses */
    private handleErrorResponse;
    /** Extract error message from response body */
    private getErrorMessage;
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
}

/**
 * Base service class
 */

/** Base service that all services extend */
declare abstract class BaseService {
    protected readonly http: HttpClient;
    protected readonly apiVersion: string;
    constructor(http: HttpClient, apiVersion?: string);
    /** Build endpoint path */
    protected endpoint(path: string): string;
    /** Build endpoint path without version prefix */
    protected rawEndpoint(path: string): string;
}

/**
 * Authentication Service
 */

/** Authentication service for SIWE/SIWS */
declare class AuthService extends BaseService {
    constructor(http: HttpClient);
    /**
     * Get a nonce for authentication
     * The nonce should be used in the SIWE/SIWS message
     *
     * @param address - The wallet address to get a nonce for
     */
    getNonce(address: WalletAddress): Promise<string>;
    /**
     * Verify SIWE credentials and create session
     *
     * Parses the SIWE message to extract address, chainId, and nonce
     * as required by the PeerSpeak verify endpoint.
     */
    verifySiwe(message: string, signature: string): Promise<AuthResult>;
    /**
     * Verify SIWS credentials and create session
     */
    verifySiws(message: string, signature: string): Promise<AuthResult>;
    /**
     * Authenticate with provided credentials
     * Returns session data on success
     */
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    /**
     * Validate an existing session
     */
    validateSession(session: SessionData): Promise<boolean>;
    /**
     * Refresh session token
     */
    refreshSession(session: SessionData): Promise<SessionData>;
    /**
     * Logout and invalidate session
     */
    logout(): Promise<void>;
    /**
     * Get wallet address from session data
     */
    getWalletAddress(session: SessionData): WalletAddress;
}

/**
 * Party Lines Service - Matches PeerSpeak v1 API
 */

/** Party Lines service - direct mapping to PeerSpeak v1 API */
declare class PartyLinesService extends BaseService {
    constructor(http: HttpClient);
    /**
     * Query party lines with filtering and pagination
     * No authentication required for read-only access
     */
    query(options?: QueryPartyLinesOptions): Promise<PartyLinesResponse>;
    /**
     * Get all party lines (convenience method)
     */
    getAll(options?: QueryPartyLinesOptions): Promise<PartyLine[]>;
    /**
     * Get active party lines
     */
    getActive(options?: Omit<QueryPartyLinesOptions, 'isActive'>): Promise<PartyLine[]>;
    /**
     * Search party lines by name or description
     */
    search(searchTerm: string, options?: Omit<QueryPartyLinesOptions, 'search'>): Promise<PartyLine[]>;
    /**
     * Create a new party line
     * Requires API key authentication
     */
    create(options: CreatePartyLineOptions): Promise<CreatePartyLineResult>;
    /**
     * Get a party line by room code
     */
    getByRoomCode(roomCode: string): Promise<PartyLine>;
    /**
     * Get a party line by ID
     */
    getById(id: string): Promise<PartyLine>;
}

/**
 * Registry Service - Public registry features (no auth required)
 */

/** Profile search result */
interface ProfileSearchResult {
    walletAddress: string;
    displayName: string;
    avatar?: string;
    bio?: string;
}
/** Registry service for public features */
declare class RegistryService extends BaseService {
    constructor(http: HttpClient);
    /**
     * List public rooms
     */
    listPublicRooms(params?: PaginationParams): Promise<ConferenceRoom[]>;
    /**
     * Get token info
     */
    getTokenInfo(contractAddress: string): Promise<{
        name: string;
        symbol: string;
        decimals: number;
        totalSupply: string;
    }>;
    /**
     * Search profiles
     */
    searchProfiles(options: {
        query: string;
        limit?: number;
    }): Promise<ProfileSearchResult[]>;
    /**
     * Get profile by ENS name
     */
    getProfileByENS(ensName: string): Promise<DialProfile>;
}

/**
 * Calls Service - Wallet-to-Wallet Calling
 */

/** Calls service for wallet-to-wallet calling */
declare class CallsService extends BaseService {
    private localStream?;
    private remoteStreams;
    constructor(http: HttpClient);
    /**
     * Start a call to another wallet address
     */
    start(options: StartCallOptions): Promise<Call>;
    /**
     * Answer an incoming call
     */
    answer(callId: string): Promise<Call>;
    /**
     * Decline an incoming call
     */
    decline(callId: string, options?: DeclineCallOptions): Promise<void>;
    /**
     * End an active call
     */
    end(callId: string): Promise<void>;
    /**
     * Get call by ID
     */
    get(callId: string): Promise<Call>;
    /**
     * Get call history
     */
    getHistory(params?: PaginationParams & {
        with?: WalletAddress;
    }): Promise<Call[]>;
    /**
     * Mute your microphone
     */
    mute(callId: string): Promise<void>;
    /**
     * Unmute your microphone
     */
    unmute(callId: string): Promise<void>;
    /**
     * Toggle mute state
     */
    toggleMute(callId: string): Promise<void>;
    /**
     * Disable video
     */
    disableVideo(callId: string): Promise<void>;
    /**
     * Enable video
     */
    enableVideo(callId: string): Promise<void>;
    /**
     * Toggle video state
     */
    toggleVideo(callId: string): Promise<void>;
    /**
     * Set speaker (earpiece or speaker)
     */
    setSpeaker(callId: string, enabled: boolean): Promise<void>;
    /**
     * Get local media stream for a call
     */
    getLocalStream(_callId: string): MediaStream | undefined;
    /**
     * Get remote media stream for a call
     */
    getRemoteStream(callId: string): MediaStream | undefined;
    /**
     * Start recording the call
     */
    startRecording(callId: string): Promise<CallRecording>;
    /**
     * Stop recording the call
     */
    stopRecording(callId: string): Promise<CallRecording>;
    /**
     * Set custom ringtone
     */
    setRingtone(audioUrl: string): void;
    /**
     * Internal: Set local stream (called by WebRTC layer)
     * @internal
     */
    _setLocalStream(stream: MediaStream): void;
    /**
     * Internal: Set remote stream (called by WebRTC layer)
     * @internal
     */
    _setRemoteStream(callId: string, stream: MediaStream): void;
    /**
     * Internal: Clear streams when call ends
     * @internal
     */
    _clearStreams(callId: string): void;
}

/**
 * Chats Service - E2EE DMs and Groups
 *
 * @see specs/04-chats.md for full specification
 * @see specs/04a-chats-architecture.md for provider details
 */

/** Chat service for E2EE DMs and Groups */
declare class ChatService extends BaseService {
    constructor(http: HttpClient);
    /**
     * Send a message to a wallet address
     */
    send(options: SendMessageOptions): Promise<Message>;
    /**
     * Send message with media attachment
     */
    private sendWithMedia;
    /**
     * Get all threads (DMs and Groups)
     */
    listThreads(params?: PaginationParams): Promise<Conversation[]>;
    /**
     * Get conversation with a specific wallet
     * @deprecated Use listThreads() instead
     */
    getConversations(params?: PaginationParams): Promise<Conversation[]>;
    /**
     * Get thread with a specific wallet
     */
    getThread(options: GetConversationOptions): Promise<Conversation>;
    /**
     * Get conversation with a specific wallet
     * @deprecated Use getThread() instead
     */
    getConversation(options: GetConversationOptions): Promise<Conversation>;
    /**
     * Get messages with pagination
     */
    listMessages(options: GetMessagesOptions): Promise<Message[]>;
    /**
     * Get messages with pagination
     * @deprecated Use listMessages() instead
     */
    getMessages(options: GetMessagesOptions): Promise<Message[]>;
    /**
     * Mark a message as read
     */
    markAsRead(messageId: string): Promise<void>;
    /**
     * Add reaction to a message
     */
    addReaction(options: {
        messageId: string;
        emoji: string;
    }): Promise<void>;
    /**
     * Remove reaction from a message
     */
    removeReaction(options: {
        messageId: string;
        emoji: string;
    }): Promise<void>;
    /**
     * Start typing indicator
     */
    startTyping(options: {
        threadId: string;
    }): Promise<void>;
    /**
     * Stop typing indicator
     */
    stopTyping(options: {
        threadId: string;
    }): Promise<void>;
    /**
     * Create a DM thread
     */
    createDM(options: {
        otherDialUserId: WalletAddress;
    }): Promise<Thread>;
    /**
     * Create a topic-based thread
     * @deprecated Use createDM() or createGroup() instead
     */
    createThread(options: CreateThreadOptions): Promise<Thread>;
    /**
     * Create a managed thread (for platform developers)
     */
    createManagedThread(options: {
        participants: WalletAddress[];
        topic: string;
        metadata?: Record<string, unknown>;
    }): Promise<Thread>;
    /**
     * List managed threads
     */
    listManagedThreads(options?: {
        filters?: Record<string, unknown>;
    } & PaginationParams): Promise<Thread[]>;
    /**
     * Archive a thread
     */
    archiveThread(threadId: string): Promise<void>;
    /**
     * Create a group
     */
    createGroup(options: CreateGroupOptions): Promise<Group>;
    /**
     * Invite users to a group
     */
    inviteToGroup(options: {
        groupId: string;
        addresses: WalletAddress[];
    }): Promise<void>;
    /**
     * Add member to group
     */
    addMember(options: {
        threadId: string;
        address: WalletAddress;
    }): Promise<void>;
    /**
     * Add member to group
     * @deprecated Use addMember() instead
     */
    addGroupMember(options: {
        groupId: string;
        address: WalletAddress;
    }): Promise<void>;
    /**
     * Remove member from group
     */
    removeMember(options: {
        threadId: string;
        address: WalletAddress;
    }): Promise<void>;
    /**
     * Remove member from group
     * @deprecated Use removeMember() instead
     */
    removeGroupMember(options: {
        groupId: string;
        address: WalletAddress;
    }): Promise<void>;
    /**
     * Leave a group
     */
    leaveGroup(threadId: string): Promise<void>;
    /**
     * Update group info
     */
    updateGroup(options: {
        threadId: string;
        name?: string;
        avatar?: File | Blob;
    }): Promise<Group>;
    /**
     * Delete a message
     */
    delete(messageId: string, options?: {
        forEveryone?: boolean;
    }): Promise<void>;
    /**
     * Search messages (local only - server-side search incompatible with E2EE)
     */
    search(options: {
        query: string;
        threadId?: string;
        limit?: number;
    }): Promise<Message[]>;
}

/**
 * Profile Service - Dial Profile Management
 */

/** Profile service for managing Dial profiles */
declare class ProfileService extends BaseService {
    constructor(http: HttpClient);
    /**
     * Get the current user's profile
     */
    get(): Promise<DialProfile>;
    /**
     * Get profile by wallet address
     */
    getProfile(options: {
        walletAddress: WalletAddress;
    }): Promise<DialProfile>;
    /**
     * Update the current user's profile
     */
    update(options: UpdateProfileOptions): Promise<DialProfile>;
    /**
     * Update avatar
     */
    updateAvatar(_options: {
        file: File | Blob;
    }): Promise<DialProfile>;
    /**
     * Set status
     */
    setStatus(status: ProfileStatus, options?: SetStatusOptions): Promise<void>;
    /**
     * Get current status
     */
    getStatus(): Promise<StatusInfo>;
    /**
     * Update preferences
     */
    updatePreferences(preferences: Partial<ProfilePreferences>): Promise<void>;
    /**
     * Update privacy settings
     */
    updatePrivacy(privacy: Partial<PrivacySettings>): Promise<void>;
    /**
     * Update notification settings
     */
    updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void>;
    /**
     * Enable Do Not Disturb
     */
    enableDoNotDisturb(options?: DoNotDisturbOptions): Promise<void>;
    /**
     * Disable Do Not Disturb
     */
    disableDoNotDisturb(): Promise<void>;
    /**
     * Block a user
     */
    blockUser(walletAddress: WalletAddress): Promise<void>;
    /**
     * Unblock a user
     */
    unblockUser(walletAddress: WalletAddress): Promise<void>;
    /**
     * Get blocked users
     */
    getBlockedUsers(): Promise<WalletAddress[]>;
    /**
     * Link ENS name
     */
    linkENS(options: {
        ensName: string;
    }): Promise<void>;
    /**
     * Verify Twitter
     */
    verifyTwitter(options: {
        handle: string;
    }): Promise<void>;
    /**
     * Verify GitHub
     */
    verifyGithub(options: {
        username: string;
    }): Promise<void>;
    /**
     * Add contact
     */
    addContact(options: AddContactOptions): Promise<Contact>;
    /**
     * Get contacts
     */
    getContacts(params?: PaginationParams): Promise<Contact[]>;
    /**
     * Update contact
     */
    updateContact(options: UpdateContactOptions): Promise<Contact>;
    /**
     * Remove contact
     */
    removeContact(walletAddress: WalletAddress): Promise<void>;
}

/**
 * Voicemail Service
 */

/** Voicemail service */
declare class VoicemailService extends BaseService {
    constructor(http: HttpClient);
    /**
     * Start recording a voicemail
     */
    startRecording(options: StartRecordingOptions): Promise<RecordingSession>;
    /**
     * Stop recording a voicemail
     */
    stopRecording(voicemailId: string): Promise<Voicemail>;
    /**
     * Record a voicemail (convenience method)
     */
    record(options: StartRecordingOptions): Promise<RecordingSession>;
    /**
     * Get all voicemails
     */
    getAll(options?: GetVoicemailsOptions): Promise<Voicemail[]>;
    /**
     * Get a specific voicemail
     */
    get(voicemailId: string): Promise<Voicemail>;
    /**
     * Mark voicemail as read
     */
    markAsRead(voicemailId: string): Promise<void>;
    /**
     * Request transcription for a voicemail
     */
    transcribe(voicemailId: string): Promise<Transcription>;
    /**
     * Delete a voicemail
     */
    delete(voicemailId: string): Promise<void>;
    /**
     * Archive a voicemail
     */
    archive(voicemailId: string): Promise<void>;
    /**
     * Get archived voicemails
     */
    getArchived(): Promise<Voicemail[]>;
    /**
     * Download voicemail audio
     */
    download(voicemailId: string): Promise<Blob>;
    /**
     * Get waveform data for visualization
     */
    getWaveform(voicemailId: string): Promise<WaveformData>;
    /**
     * Set greeting
     */
    setGreeting(options: SetGreetingOptions): Promise<VoicemailGreeting>;
    /**
     * Get current greeting
     */
    getGreeting(): Promise<VoicemailGreeting>;
    /**
     * Enable voicemail
     */
    enable(): Promise<void>;
    /**
     * Disable voicemail
     */
    disable(): Promise<void>;
    /**
     * Check if voicemail is enabled
     */
    isEnabled(): Promise<boolean>;
    /**
     * Set notification preferences
     */
    setNotificationPreferences(preferences: VoicemailNotificationPreferences): Promise<void>;
}

/**
 * @file conference.ts
 * @description Conference service for multi-party video conferencing rooms.
 * @layer Services
 *
 * Handles REST signaling (source of truth for server state) and optionally
 * delegates real-time media operations to a pluggable IMediaProvider (e.g. HMS).
 *
 * Dual-dispatch pattern: methods like muteAudio() do both the REST call AND
 * the media provider call. REST is authoritative — media errors are logged
 * but don't prevent the REST operation from succeeding.
 *
 * NOTE: This service is for multi-party conference rooms and party lines.
 * 1:1 P2P calls use PeerJS via CallsService — a completely separate system.
 */

/** Conference service for video conferencing */
declare class ConferenceService extends BaseService {
    private participantStreams;
    private _mediaProvider;
    constructor(http: HttpClient);
    /**
     * Set the active media provider for real-time audio/video.
     * Pass null to detach.
     */
    setMediaProvider(provider: IMediaProvider | null): void;
    /** Get the current media provider, or null if none is set */
    get mediaProvider(): IMediaProvider | null;
    /**
     * Connect to the media session for a room.
     * Requires room.mediaToken (returned by the backend join route).
     * This is a separate step from join() so that join() stays isomorphic (REST-only).
     */
    connectMedia(room: ConferenceRoom, userName: string, config?: MediaProviderConfig): Promise<void>;
    /**
     * Disconnect from the media session.
     * Safe to call even if no provider is set or not connected.
     */
    disconnectMedia(): Promise<void>;
    /**
     * Create a conference room
     */
    create(options: CreateRoomOptions): Promise<ConferenceRoom>;
    /**
     * Join a conference room by ID.
     * Maps backend field names (token, role) to SDK field names (mediaToken, mediaRole).
     */
    join(options: JoinRoomOptions): Promise<ConferenceRoom>;
    /**
     * Join a conference room by URL.
     * Maps backend field names (token, role) to SDK field names (mediaToken, mediaRole).
     */
    joinByUrl(options: JoinByUrlOptions): Promise<ConferenceRoom>;
    /**
     * Normalize backend response fields to SDK ConferenceRoom shape.
     * Backend returns `token` and `role`; SDK uses `mediaToken` and `mediaRole`.
     */
    private normalizeRoomResponse;
    /**
     * Leave a conference room.
     * Also disconnects from media session if a provider is active.
     */
    leave(roomId: string): Promise<void>;
    /**
     * Get participants in a room
     */
    getParticipants(roomId: string): Promise<Participant[]>;
    /**
     * Get participant's media stream
     */
    getParticipantStream(roomId: string, participantId: string): MediaStream | undefined;
    /**
     * Mute your audio
     */
    muteAudio(roomId: string): Promise<void>;
    /**
     * Unmute your audio
     */
    unmuteAudio(roomId: string): Promise<void>;
    /**
     * Mute a specific participant (host only)
     */
    muteParticipant(roomId: string, participantId: string): Promise<void>;
    /**
     * Mute all participants (host only)
     */
    muteAll(roomId: string): Promise<void>;
    /**
     * Disable your video
     */
    disableVideo(roomId: string): Promise<void>;
    /**
     * Enable your video
     */
    enableVideo(roomId: string): Promise<void>;
    /**
     * Request participant to enable video
     */
    requestVideo(roomId: string, participantId: string): Promise<void>;
    /**
     * Start screen share
     */
    startScreenShare(roomId: string): Promise<void>;
    /**
     * Stop screen share
     */
    stopScreenShare(roomId: string): Promise<void>;
    /**
     * Start recording
     */
    startRecording(roomId: string): Promise<RoomRecording>;
    /**
     * Stop recording
     */
    stopRecording(roomId: string): Promise<RoomRecording>;
    /**
     * Get recordings for a room
     */
    getRecordings(roomId: string): Promise<RoomRecording[]>;
    /**
     * Send message in room
     */
    sendMessage(roomId: string, options: SendRoomMessageOptions): Promise<RoomMessage>;
    /**
     * Set room layout
     */
    setLayout(roomId: string, layout: LayoutOption, options?: SetLayoutOptions): Promise<void>;
    /**
     * End room (host only)
     */
    end(roomId: string): Promise<void>;
    /**
     * Remove participant (host only)
     */
    removeParticipant(roomId: string, participantId: string): Promise<void>;
    /**
     * Transfer host role
     */
    transferHost(roomId: string, newHostParticipantId: string): Promise<void>;
    /**
     * Create breakout rooms
     */
    createBreakoutRooms(roomId: string, options: CreateBreakoutRoomsOptions): Promise<BreakoutRoom[]>;
    /**
     * Move participant to breakout room
     */
    moveToBreakout(roomId: string, participantId: string, breakoutRoomId: string): Promise<void>;
    /**
     * Close all breakout rooms
     */
    closeBreakoutRooms(roomId: string): Promise<void>;
    /**
     * Create poll
     */
    createPoll(roomId: string, options: CreatePollOptions): Promise<Poll>;
    /**
     * Vote on poll
     */
    vote(roomId: string, pollId: string, optionIndex: number): Promise<void>;
    /**
     * Get poll results
     */
    getPollResults(roomId: string, pollId: string): Promise<PollResults>;
    /**
     * Raise hand
     */
    raiseHand(roomId: string): Promise<void>;
    /**
     * Lower hand
     */
    lowerHand(roomId: string): Promise<void>;
    /**
     * Set video quality
     */
    setVideoQuality(roomId: string, settings: VideoQualitySettings): Promise<void>;
    /**
     * Enable/disable adaptive quality
     */
    setAdaptiveQuality(roomId: string, enabled: boolean): Promise<void>;
    /**
     * Get room statistics
     */
    getStats(roomId: string): Promise<RoomStats>;
    /**
     * Internal: Set participant stream
     * @internal
     */
    _setParticipantStream(roomId: string, participantId: string, stream: MediaStream): void;
    /**
     * Fire-and-forget media provider call.
     * Logs errors but doesn't throw — REST is the source of truth.
     */
    private _mediaDispatch;
}

/**
 * @file contacts-book.ts
 * @description ContactsBook — orchestrator for managing Dial contacts.
 * @layer Services
 *
 * Wraps an IContactsBookProvider with an event-driven API, in-memory cache,
 * and convenience helpers. Consumers subscribe to events for reactive updates.
 */

declare class ContactsBook {
    private readonly provider;
    private readonly emitter;
    private cache;
    private loaded;
    constructor(provider: IContactsBookProvider, config?: ContactsBookConfig);
    /** Load (or reload) all contacts from the provider into cache */
    load(): Promise<Contact[]>;
    /** Get all contacts (from cache if loaded, otherwise loads first) */
    getAll(): Promise<Contact[]>;
    /** Get a single contact by wallet address */
    get(walletAddress: WalletAddress): Promise<Contact | null>;
    /** Check if a wallet address is in the contacts book */
    has(walletAddress: WalletAddress): Promise<boolean>;
    /** Add a contact */
    add(options: AddContactOptions): Promise<Contact>;
    /** Update a contact's nickname, tags, or notes */
    update(options: UpdateContactOptions): Promise<Contact>;
    /** Remove a contact */
    remove(walletAddress: WalletAddress): Promise<void>;
    /** Subscribe to a contacts book event */
    on<K extends keyof ContactsBookEvents>(event: K, callback: (payload: ContactsBookEvents[K]) => void): void;
    /** Unsubscribe from a contacts book event */
    off<K extends keyof ContactsBookEvents>(event: K, callback?: (payload: ContactsBookEvents[K]) => void): void;
    /** Remove all event listeners */
    removeAllListeners(): void;
    private emit;
}

/**
 * UserDialer - Authenticated client instance
 *
 * This class represents an authenticated user session and provides access
 * to all user-specific features like calls, messaging, profile management, etc.
 *
 * @remarks
 * UserDialer is created via `dial.asUser()` after authentication.
 * All operations use the authenticated user's context.
 *
 * @example
 * ```typescript
 * const userDialer = await dial.asUser({
 *   siwe: { message, signature }
 * });
 *
 * // Now use authenticated features
 * await userDialer.calls.start({ to: '0x...', type: 'audio' });
 * ```
 *
 * @module @dial/sdk/client/user-dialer
 */

/**
 * Authenticated user client
 *
 * Provides access to all user-specific SDK features after authentication.
 * Created via `DialClient.asUser()`.
 */
declare class UserDialer {
    private readonly http;
    private readonly session;
    private readonly events;
    /** @internal */
    private readonly authService;
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
    readonly calls: CallsService;
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
    readonly chat: ChatService;
    /**
     * Messages service - wallet-to-wallet messaging
     * @deprecated Use chat instead
     */
    readonly messages: ChatService;
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
    readonly profile: ProfileService;
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
    readonly voicemail: VoicemailService;
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
    readonly conference: ConferenceService;
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
    contacts: ContactsBook;
    constructor(http: HttpClient, session: SessionData, contactsProvider?: IContactsBookProvider, contactsConfig?: ContactsBookConfig);
    /**
     * Replace the contacts book provider at runtime
     *
     * @example
     * ```typescript
     * import { ApiContactsBookProvider } from '@dial-wtf/sdk';
     * userDialer.setContactsProvider(new ApiContactsBookProvider(httpClient));
     * ```
     */
    setContactsProvider(provider: IContactsBookProvider, config?: ContactsBookConfig): void;
    /**
     * Get the authenticated user's wallet address
     */
    get walletAddress(): WalletAddress;
    /**
     * Check if the session is still valid
     */
    isSessionValid(): Promise<boolean>;
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
    exportSession(): SessionData;
    /**
     * Logout and invalidate the session
     */
    logout(): Promise<void>;
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
    on<T extends DialEventType>(event: T, listener: EventListener<T>): void;
    /**
     * Subscribe to an event (only fires once)
     */
    once<T extends DialEventType>(event: T, listener: EventListener<T>): void;
    /**
     * Unsubscribe from events
     */
    off<T extends DialEventType>(event: T, listener?: EventListener<T>): void;
    /**
     * Emit an event (internal use)
     * @internal
     */
    _emit<T extends DialEventType>(event: T, payload: Parameters<EventListener<T>>[0]): void;
}

/**
 * DialClient - Main SDK Entry Point
 *
 * The DialClient is the primary entry point for the Dial SDK. It provides
 * both unauthenticated (universal) and authenticated (user-bound) access
 * to Dial features.
 *
 * @remarks
 * This client is fully isomorphic and works in both browser and Node.js environments.
 * Some features (like media streaming) require browser-specific APIs.
 *
 * @example
 * ```typescript
 * import { DialClient } from '@dial/sdk';
 *
 * // Initialize universal client
 * const dial = new DialClient({
 *   apiKey: process.env.DIAL_API_KEY,
 *   network: 'mainnet' // or 'staging', 'testnet'
 * });
 *
 * // Use public features (no auth required)
 * const rooms = await dial.partyLines.getActive();
 *
 * // Authenticate for user-specific features
 * const userDialer = await dial.asUser({
 *   siwe: { message, signature }
 * });
 * ```
 *
 * @module @dial/sdk
 */

/**
 * Main Dial SDK client
 *
 * Provides access to both public (unauthenticated) and authenticated features.
 */
declare class DialClient {
    /** SDK version */
    static readonly version = "0.3.0";
    private readonly config;
    private readonly http;
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
    readonly auth: AuthService;
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
    readonly partyLines: PartyLinesService;
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
    readonly registry: RegistryService;
    /**
     * Create a new DialClient instance
     *
     * @param config - Client configuration options
     */
    constructor(config?: DialClientConfig);
    /**
     * Resolve configuration with defaults
     */
    private resolveConfig;
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
    asUser(credentials: AuthCredentials): Promise<UserDialer>;
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
    restoreSession(session: SessionData): Promise<UserDialer>;
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
    authenticateWithWallet(options: {
        wallet: {
            getAddress: () => Promise<string>;
            signMessage: (message: string) => Promise<string>;
        };
        chainId: number;
        domain?: string;
        uri?: string;
    }): Promise<UserDialer>;
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
    authenticateWithSolana(options: {
        wallet: {
            publicKey: {
                toBase58: () => string;
            };
            signMessage: (message: Uint8Array) => Promise<Uint8Array>;
        };
        domain?: string;
        uri?: string;
    }): Promise<UserDialer>;
    /**
     * Simple base58 encoding for signatures
     * @internal
     */
    private uint8ArrayToBase58;
}

/**
 * @file contacts-book-local.ts
 * @description LocalContactsBookProvider — localStorage-backed contacts storage.
 * @layer Services
 *
 * Default provider that persists contacts per-wallet in localStorage (browser)
 * or an in-memory Map (Node.js). Works offline with zero backend dependencies.
 */

/** Options for the local provider */
interface LocalContactsBookProviderOptions {
    /** Owner wallet address — used to namespace storage keys */
    walletAddress: WalletAddress;
    /** Storage key prefix (default: 'dial_contacts') */
    storagePrefix?: string;
}
declare class LocalContactsBookProvider implements IContactsBookProvider {
    private readonly storageKey;
    private cache;
    private loaded;
    constructor(options: LocalContactsBookProviderOptions);
    getAll(): Promise<Contact[]>;
    get(walletAddress: WalletAddress): Promise<Contact | null>;
    add(options: AddContactOptions): Promise<Contact>;
    update(options: UpdateContactOptions): Promise<Contact>;
    remove(walletAddress: WalletAddress): Promise<void>;
    has(walletAddress: WalletAddress): Promise<boolean>;
    private ensureLoaded;
    private persist;
}

/**
 * @file contacts-book-api.ts
 * @description ApiContactsBookProvider — backend-backed contacts storage.
 * @layer Services
 *
 * Provider that delegates CRUD operations to the PeerSpeak /profile/contacts
 * API routes via the SDK HttpClient. Use this when the backend is available.
 */

declare class ApiContactsBookProvider implements IContactsBookProvider {
    private readonly http;
    private readonly apiVersion;
    constructor(http: HttpClient, apiVersion?: string);
    getAll(params?: PaginationParams): Promise<Contact[]>;
    get(walletAddress: WalletAddress): Promise<Contact | null>;
    add(options: AddContactOptions): Promise<Contact>;
    update(options: UpdateContactOptions): Promise<Contact>;
    remove(walletAddress: WalletAddress): Promise<void>;
    has(walletAddress: WalletAddress): Promise<boolean>;
    private endpoint;
}

/**
 * Dial SDK Error types
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
 * Environment Detection Utilities
 *
 * The Dial SDK is designed to be isomorphic, meaning it can run in both
 * browser and Node.js environments. However, certain features are only
 * available in specific environments.
 *
 * @module @dial/sdk/utils/environment
 */
/** Environment type */
type Environment = "browser" | "node" | "unknown";
/**
 * Detect the current runtime environment
 */
declare function detectEnvironment(): Environment;
/** Current environment (cached) */
declare const ENVIRONMENT: Environment;
/** Check if running in browser */
declare const IS_BROWSER: boolean;
/** Check if running in Node.js */
declare const IS_NODE: boolean;
/**
 * Features that are only available in browser environment
 *
 * @remarks
 * These features require browser-specific APIs like MediaStream, WebRTC, etc.
 * - Audio/Video streaming (requires MediaStream API)
 * - Screen sharing (requires Screen Capture API)
 * - Local media streams (requires getUserMedia)
 * - Real-time call events via WebSocket
 * - Push notifications (requires Service Workers)
 */
declare const BROWSER_ONLY_FEATURES: readonly ["calls.getLocalStream", "calls.getRemoteStream", "conference.getParticipantStream", "conference.startScreenShare", "voicemail.download", "profile.updateAvatar"];
/**
 * Features that work in both environments (isomorphic)
 *
 * @remarks
 * These features use only HTTP APIs and work identically in both environments.
 * - All authentication (SIWE/SIWS message verification)
 * - Profile management
 * - Messaging (send, receive, history)
 * - Call management (start, end, mute) - but not media streams
 * - Voicemail management
 * - Conference room management
 * - Party Lines queries
 */
declare const ISOMORPHIC_FEATURES: readonly ["auth.*", "profile.*", "messages.*", "calls.start", "calls.answer", "calls.decline", "calls.end", "calls.mute", "calls.unmute", "calls.getHistory", "voicemail.getAll", "voicemail.get", "voicemail.markAsRead", "voicemail.transcribe", "conference.create", "conference.join", "conference.leave", "conference.getParticipants", "partyLines.*", "registry.*"];

export { AddContactOptions, ApiContactsBookProvider, ApiError, AuthCredentials, AuthError, AuthResult, BROWSER_ONLY_FEATURES, BreakoutRoom, Call, CallRecording, ConferenceRoom, Contact, ContactsBook, ContactsBookConfig, ContactsBookEvents, Conversation, CreateBreakoutRoomsOptions, CreateGroupOptions, CreatePartyLineOptions, CreatePartyLineResult, CreatePollOptions, CreateRoomOptions, CreateThreadOptions, DeclineCallOptions, DialClient, DialClientConfig, DialError, DialEventType, DialProfile, DoNotDisturbOptions, ENVIRONMENT, EventListener, GetConversationOptions, GetMessagesOptions, GetVoicemailsOptions, Group, IContactsBookProvider, IMediaProvider, ISOMORPHIC_FEATURES, IS_BROWSER, IS_NODE, JoinByUrlOptions, JoinRoomOptions, LayoutOption, LocalContactsBookProvider, MediaProviderConfig, Message, NetworkError, NotFoundError, NotificationSettings, PaginationParams, Participant, PartyLine, PartyLinesResponse, PermissionDeniedError, Poll, PollResults, PrivacySettings, ProfilePreferences, type ProfileSearchResult, ProfileStatus, QueryPartyLinesOptions, RateLimitError, RecordingSession, RoomMessage, RoomRecording, RoomStats, SendMessageOptions, SendRoomMessageOptions, SessionData, SessionExpiredError, SetGreetingOptions, SetLayoutOptions, SetStatusOptions, StartCallOptions, StartRecordingOptions, StatusInfo, Thread, TimeoutError, Transcription, UpdateContactOptions, UpdateProfileOptions, UserDialer, ValidationError, VideoQualitySettings, Voicemail, VoicemailGreeting, VoicemailNotificationPreferences, WalletAddress, WaveformData, detectEnvironment };
