import { IHttpTransport, ResolvedClientConfig, RequestOptions, WalletAddress, AuthResult, AuthCredentials, SessionData, QueryPartyLinesOptions, PartyLinesResponse, PartyLine, CreatePartyLineOptions, CreatePartyLineResult, PaginationParams, ConferenceRoom, DialProfile, StartCallOptions, Call, DeclineCallOptions, CallRecording, SendMessageOptions, Message, Conversation, GetConversationOptions, GetMessagesOptions, Thread, CreateThreadOptions, CreateGroupOptions, Group, UpdateProfileOptions, ProfileStatus, SetStatusOptions, StatusInfo, ProfilePreferences, PrivacySettings, NotificationSettings, DoNotDisturbOptions, AddContactOptions, Contact, UpdateContactOptions, StartRecordingOptions, RecordingSession, Voicemail, GetVoicemailsOptions, Transcription, WaveformData, SetGreetingOptions, VoicemailGreeting, VoicemailNotificationPreferences, IMediaProvider, MediaProviderConfig, CreateRoomOptions, JoinRoomOptions, JoinByUrlOptions, Participant, RoomRecording, SendRoomMessageOptions, RoomMessage, LayoutOption, SetLayoutOptions, CreateBreakoutRoomsOptions, BreakoutRoom, CreatePollOptions, Poll, PollResults, VideoQualitySettings, RoomStats, IContactsBookProvider, ContactsBookConfig, ContactsBookEvents, DialEventType, EventListener, DialClientConfig, DialEventPayloads, IDialStorage } from '@dial-wtf/core';
export { API_BASE_URLS, AddContactOptions, ApiError, ApiErrorResponse, ApiResponse, AuthCredentials, AuthError, AuthResult, BreakoutRoom, BrowserStorage, Call, CallEventPayloads, CallEventType, CallQuality, CallRecording, CallStatus, CallType, Chain, ChatEventPayloads, ChatEventType, ChatProvider, ConferenceEventPayloads, ConferenceEventType, ConferenceRoom, Contact, ContactsBookConfig, ContactsBookEvents, Conversation, CreateBreakoutRoomsOptions, CreateGroupOptions, CreatePartyLineOptions, CreatePartyLineResult, CreatePollOptions, CreateRoomOptions, CreateThreadOptions, DEFAULT_NETWORK, DeclineCallOptions, DeclineReason, DialClientConfig, DialError, DialEventEmitterInterface, DialEventPayloads, DialEventType, DialMediaDeviceInfo, DialProfile, DoNotDisturbOptions, ENVIRONMENT, Environment, EthAddress, EventListener, GetConversationOptions, GetMessagesOptions, GetVoicemailsOptions, Group, HttpMethod, IContactsBookProvider, IDialStorage, IHttpTransport, IMediaProvider, IS_BROWSER, IS_BROWSER_LIKE, IS_EXTENSION, IS_NODE, JoinByUrlOptions, JoinRoomOptions, LayoutOption, MediaAttachment, MediaConnectionState, MediaPeer, MediaProviderConfig, MediaProviderEvents, MediaSessionCredentials, MediaTrack, MediaType, MemoryStorage, Message, MessageEventPayloads, MessageEventType, MessageStatus, MessagingProvider, Network, NetworkError, NonceResponse, NotFoundError, NotificationChannelSettings, NotificationSettings, PaginatedResponse, PaginationInfo, PaginationParams, Participant, PartyLine, PartyLineCategory, PartyLinesResponse, PermissionDeniedError, Poll, PollOption, PollResults, PrivacySettings, ProfileEventPayloads, ProfileEventType, ProfileLinks, ProfilePreferences, ProfileStatus, ProfileVisibility, QueryPartyLinesOptions, RateLimitError, Reaction, RecordingSession, RequestOptions, ResolvedClientConfig, RoomMessage, RoomRecording, RoomSettings, RoomStats, RoomStatus, SDK_VERSION, SendMessageOptions, SendRoomMessageOptions, SessionData, SessionExpiredError, SetGreetingOptions, SetLayoutOptions, SetStatusOptions, SiweCredentials, SiwsCredentials, SolAddress, StartCallOptions, StartRecordingOptions, StatusInfo, Thread, ThreadModel, ThreadType, TimeoutError, Timestamp, Transcription, TypingIndicator, UpdateContactOptions, UpdateProfileOptions, ValidationError, VerifiedStatus, VideoQuality, VideoQualityOption, VideoQualitySettings, Voicemail, VoicemailEventPayloads, VoicemailEventType, VoicemailGreeting, VoicemailNotificationPreferences, WalletAddress, WaveformData, detectEnvironment, getFetch } from '@dial-wtf/core';

/**
 * @file client.ts
 * @description HTTP client for Dial API with AbortSignal composition.
 * @layer HTTP
 *
 * Addresses audit finding C4: composes caller signal with internal timeout signal
 * using AbortSignal.any() where available, with a polyfill fallback.
 */

/** Callback to refresh a session and return a new auth token. */
type SessionRefresher = () => Promise<string>;
/** HTTP client implementing IHttpTransport */
declare class HttpClient implements IHttpTransport {
    private readonly config;
    private authToken?;
    private sessionRefresher?;
    private refreshPromise?;
    private readonly inflightGets;
    constructor(config: ResolvedClientConfig);
    setAuthToken(token: string | undefined): void;
    getAuthToken(): string | undefined;
    /**
     * Register a callback to refresh the session on 401 (P2-5 fix).
     * The callback should refresh the session and return the new auth token.
     */
    setSessionRefresher(refresher: SessionRefresher | undefined): void;
    private buildUrl;
    private buildHeaders;
    /**
     * Compose multiple AbortSignals into one.
     * Uses AbortSignal.any() where available (Node 20+, modern browsers),
     * falls back to manual composition.
     */
    private composeSignals;
    request<T>(endpoint: string, options?: RequestOptions, _isRetry?: boolean): Promise<T>;
    /**
     * Refresh session, deduplicating concurrent refresh calls.
     * @internal
     */
    private refreshSession;
    private handleErrorResponse;
    private getErrorMessage;
    get<T>(endpoint: string, params?: Record<string, unknown>, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
    private executeGet;
    private toUrlParams;
    post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T>;
    delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T>;
}

/**
 * @file base.ts
 * @description Base service class.
 * @layer Services
 */

/** Base service that all services extend */
declare abstract class BaseService {
    protected readonly http: HttpClient;
    protected readonly apiVersion: string;
    constructor(http: HttpClient, apiVersion?: string);
    protected endpoint(path: string): string;
    protected rawEndpoint(path: string): string;
}

/**
 * @file auth.ts
 * @description Authentication service with dynamic siwe import.
 * @layer Services
 *
 * Addresses audit finding C1: siwe is now dynamically imported only when
 * verifySiwe() is called, so the SDK loads without siwe installed.
 */

/** Authentication service for SIWE/SIWS */
declare class AuthService extends BaseService {
    constructor(http: HttpClient);
    getNonce(address: WalletAddress): Promise<string>;
    /**
     * Verify SIWE credentials and create session.
     *
     * Uses dynamic import() for siwe to avoid crashing if not installed (C1 fix).
     */
    verifySiwe(message: string, signature: string): Promise<AuthResult>;
    verifySiws(message: string, signature: string): Promise<AuthResult>;
    authenticate(credentials: AuthCredentials): Promise<AuthResult>;
    validateSession(session: SessionData): Promise<boolean>;
    refreshSession(session: SessionData): Promise<SessionData>;
    logout(): Promise<void>;
    getWalletAddress(session: SessionData): WalletAddress;
    /**
     * Fallback SIWE message parser when the siwe package is not installed.
     * Extracts address, chainId, and nonce from the EIP-4361 formatted string.
     */
    private parseSiweFields;
}

/**
 * @file party-lines.ts
 * @description Party Lines service - matches PeerSpeak v1 API.
 * @layer Services
 */

declare class PartyLinesService extends BaseService {
    constructor(http: HttpClient);
    query(options?: QueryPartyLinesOptions): Promise<PartyLinesResponse>;
    getAll(options?: QueryPartyLinesOptions): Promise<PartyLine[]>;
    getActive(options?: Omit<QueryPartyLinesOptions, 'isActive'>): Promise<PartyLine[]>;
    search(searchTerm: string, options?: Omit<QueryPartyLinesOptions, 'search'>): Promise<PartyLine[]>;
    create(options: CreatePartyLineOptions): Promise<CreatePartyLineResult>;
    getByRoomCode(roomCode: string): Promise<PartyLine>;
    getById(id: string): Promise<PartyLine>;
}

/**
 * @file registry.ts
 * @description Registry service - public features (no auth required).
 * @layer Services
 */

interface ProfileSearchResult {
    walletAddress: string;
    displayName: string;
    avatar?: string;
    bio?: string;
}
declare class RegistryService extends BaseService {
    constructor(http: HttpClient);
    listPublicRooms(params?: PaginationParams): Promise<ConferenceRoom[]>;
    getTokenInfo(contractAddress: string): Promise<{
        name: string;
        symbol: string;
        decimals: number;
        totalSupply: string;
    }>;
    searchProfiles(options: {
        query: string;
        limit?: number;
    }): Promise<ProfileSearchResult[]>;
    getProfileByENS(ensName: string): Promise<DialProfile>;
    /**
     * Batch lookup profiles by wallet addresses.
     * Fetches up to 100 profiles in a single HTTP request.
     *
     * @example
     * ```typescript
     * const profiles = await dial.registry.getProfiles({
     *   addresses: ['0xabc...', '0xdef...']
     * });
     * ```
     */
    getProfiles(options: {
        addresses: WalletAddress[];
    }): Promise<Map<WalletAddress, DialProfile>>;
    /**
     * Resolve the verified on-chain primary ENS name for an address.
     * Returns null if no reverse ENS record is set.
     *
     * @example
     * ```typescript
     * const ens = await dial.registry.resolveENS('0x123...');
     * // => { ensName: 'vitalik.eth', verified: true }
     * ```
     */
    resolveENS(address: WalletAddress): Promise<{
        ensName: string;
        verified: boolean;
    } | null>;
}

/**
 * @file calls.ts
 * @description Calls service - Wallet-to-Wallet Calling.
 * @layer Services
 */

declare class CallsService extends BaseService {
    private localStream?;
    private remoteStreams;
    constructor(http: HttpClient);
    start(options: StartCallOptions): Promise<Call>;
    answer(callId: string): Promise<Call>;
    decline(callId: string, options?: DeclineCallOptions): Promise<void>;
    end(callId: string): Promise<void>;
    get(callId: string): Promise<Call>;
    getHistory(params?: PaginationParams & {
        with?: WalletAddress;
    }): Promise<Call[]>;
    mute(callId: string): Promise<void>;
    unmute(callId: string): Promise<void>;
    toggleMute(callId: string): Promise<void>;
    disableVideo(callId: string): Promise<void>;
    enableVideo(callId: string): Promise<void>;
    toggleVideo(callId: string): Promise<void>;
    setSpeaker(callId: string, enabled: boolean): Promise<void>;
    getLocalStream(_callId: string): MediaStream | undefined;
    getRemoteStream(callId: string): MediaStream | undefined;
    startRecording(callId: string): Promise<CallRecording>;
    stopRecording(callId: string): Promise<CallRecording>;
    setRingtone(audioUrl: string): void;
    /** @internal */
    _setLocalStream(stream: MediaStream): void;
    /** @internal */
    _setRemoteStream(callId: string, stream: MediaStream): void;
    /** @internal */
    _clearStreams(callId: string): void;
}

/**
 * @file chats.ts
 * @description Chat service - E2EE DMs and Groups.
 * @layer Services
 */

declare class ChatService extends BaseService {
    constructor(http: HttpClient);
    send(options: SendMessageOptions): Promise<Message>;
    private sendWithMedia;
    listThreads(params?: PaginationParams): Promise<Conversation[]>;
    /** @deprecated Use listThreads() */
    getConversations(params?: PaginationParams): Promise<Conversation[]>;
    getThread(options: GetConversationOptions): Promise<Conversation>;
    /** @deprecated Use getThread() */
    getConversation(options: GetConversationOptions): Promise<Conversation>;
    listMessages(options: GetMessagesOptions): Promise<Message[]>;
    /** @deprecated Use listMessages() */
    getMessages(options: GetMessagesOptions): Promise<Message[]>;
    markAsRead(messageId: string): Promise<void>;
    addReaction(options: {
        messageId: string;
        emoji: string;
    }): Promise<void>;
    removeReaction(options: {
        messageId: string;
        emoji: string;
    }): Promise<void>;
    startTyping(options: {
        threadId: string;
    }): Promise<void>;
    stopTyping(options: {
        threadId: string;
    }): Promise<void>;
    createDM(options: {
        otherDialUserId: WalletAddress;
    }): Promise<Thread>;
    /** @deprecated Use createDM() or createGroup() */
    createThread(options: CreateThreadOptions): Promise<Thread>;
    createManagedThread(options: {
        participants: WalletAddress[];
        topic: string;
        metadata?: Record<string, unknown>;
    }): Promise<Thread>;
    listManagedThreads(options?: {
        filters?: Record<string, unknown>;
    } & PaginationParams): Promise<Thread[]>;
    archiveThread(threadId: string): Promise<void>;
    createGroup(options: CreateGroupOptions): Promise<Group>;
    inviteToGroup(options: {
        groupId: string;
        addresses: WalletAddress[];
    }): Promise<void>;
    addMember(options: {
        threadId: string;
        address: WalletAddress;
    }): Promise<void>;
    /** @deprecated Use addMember() */
    addGroupMember(options: {
        groupId: string;
        address: WalletAddress;
    }): Promise<void>;
    removeMember(options: {
        threadId: string;
        address: WalletAddress;
    }): Promise<void>;
    /** @deprecated Use removeMember() */
    removeGroupMember(options: {
        groupId: string;
        address: WalletAddress;
    }): Promise<void>;
    leaveGroup(threadId: string): Promise<void>;
    updateGroup(options: {
        threadId: string;
        name?: string;
        avatar?: File | Blob;
    }): Promise<Group>;
    delete(messageId: string, options?: {
        forEveryone?: boolean;
    }): Promise<void>;
    search(options: {
        query: string;
        threadId?: string;
        limit?: number;
    }): Promise<Message[]>;
}

/**
 * @file profile.ts
 * @description Profile service - Dial Profile Management.
 * @layer Services
 */

declare class ProfileService extends BaseService {
    constructor(http: HttpClient);
    get(): Promise<DialProfile>;
    getProfile(options: {
        walletAddress: WalletAddress;
    }): Promise<DialProfile>;
    update(options: UpdateProfileOptions): Promise<DialProfile>;
    updateAvatar(_options: {
        file: File | Blob;
    }): Promise<DialProfile>;
    setStatus(status: ProfileStatus, options?: SetStatusOptions): Promise<void>;
    getStatus(): Promise<StatusInfo>;
    updatePreferences(preferences: Partial<ProfilePreferences>): Promise<void>;
    updatePrivacy(privacy: Partial<PrivacySettings>): Promise<void>;
    updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void>;
    enableDoNotDisturb(options?: DoNotDisturbOptions): Promise<void>;
    disableDoNotDisturb(): Promise<void>;
    blockUser(walletAddress: WalletAddress): Promise<void>;
    unblockUser(walletAddress: WalletAddress): Promise<void>;
    getBlockedUsers(): Promise<WalletAddress[]>;
    linkENS(options: {
        ensName: string;
    }): Promise<void>;
    verifyTwitter(options: {
        handle: string;
    }): Promise<void>;
    verifyGithub(options: {
        username: string;
    }): Promise<void>;
    /**
     * @deprecated Use `userDialer.contacts.add()` instead. ProfileService contact
     * methods bypass ContactsBook's cache and event system, causing stale reads.
     */
    addContact(options: AddContactOptions): Promise<Contact>;
    /**
     * @deprecated Use `userDialer.contacts.getAll()` instead. ProfileService contact
     * methods bypass ContactsBook's cache and event system, causing stale reads.
     */
    getContacts(params?: PaginationParams): Promise<Contact[]>;
    /**
     * @deprecated Use `userDialer.contacts.update()` instead. ProfileService contact
     * methods bypass ContactsBook's cache and event system, causing stale reads.
     */
    updateContact(options: UpdateContactOptions): Promise<Contact>;
    /**
     * @deprecated Use `userDialer.contacts.remove()` instead. ProfileService contact
     * methods bypass ContactsBook's cache and event system, causing stale reads.
     */
    removeContact(walletAddress: WalletAddress): Promise<void>;
}

/**
 * @file voicemail.ts
 * @description Voicemail service.
 * @layer Services
 */

declare class VoicemailService extends BaseService {
    constructor(http: HttpClient);
    startRecording(options: StartRecordingOptions): Promise<RecordingSession>;
    stopRecording(voicemailId: string): Promise<Voicemail>;
    record(options: StartRecordingOptions): Promise<RecordingSession>;
    getAll(options?: GetVoicemailsOptions): Promise<Voicemail[]>;
    get(voicemailId: string): Promise<Voicemail>;
    markAsRead(voicemailId: string): Promise<void>;
    transcribe(voicemailId: string): Promise<Transcription>;
    delete(voicemailId: string): Promise<void>;
    archive(voicemailId: string): Promise<void>;
    getArchived(): Promise<Voicemail[]>;
    download(voicemailId: string): Promise<Blob>;
    getWaveform(voicemailId: string): Promise<WaveformData>;
    setGreeting(options: SetGreetingOptions): Promise<VoicemailGreeting>;
    getGreeting(): Promise<VoicemailGreeting>;
    enable(): Promise<void>;
    disable(): Promise<void>;
    isEnabled(): Promise<boolean>;
    setNotificationPreferences(preferences: VoicemailNotificationPreferences): Promise<void>;
}

/**
 * @file conference.ts
 * @description Conference service for multi-party video conferencing rooms.
 * @layer Services
 */

declare class ConferenceService extends BaseService {
    private participantStreams;
    private _mediaProvider;
    constructor(http: HttpClient);
    setMediaProvider(provider: IMediaProvider | null): void;
    get mediaProvider(): IMediaProvider | null;
    connectMedia(room: ConferenceRoom, userName: string, config?: MediaProviderConfig): Promise<void>;
    disconnectMedia(): Promise<void>;
    create(options: CreateRoomOptions): Promise<ConferenceRoom>;
    join(options: JoinRoomOptions): Promise<ConferenceRoom>;
    joinByUrl(options: JoinByUrlOptions): Promise<ConferenceRoom>;
    private normalizeRoomResponse;
    leave(roomId: string): Promise<void>;
    getParticipants(roomId: string): Promise<Participant[]>;
    getParticipantStream(roomId: string, participantId: string): MediaStream | undefined;
    muteAudio(roomId: string): Promise<void>;
    unmuteAudio(roomId: string): Promise<void>;
    muteParticipant(roomId: string, participantId: string): Promise<void>;
    muteAll(roomId: string): Promise<void>;
    disableVideo(roomId: string): Promise<void>;
    enableVideo(roomId: string): Promise<void>;
    requestVideo(roomId: string, participantId: string): Promise<void>;
    startScreenShare(roomId: string): Promise<void>;
    stopScreenShare(roomId: string): Promise<void>;
    startRecording(roomId: string): Promise<RoomRecording>;
    stopRecording(roomId: string): Promise<RoomRecording>;
    getRecordings(roomId: string): Promise<RoomRecording[]>;
    sendMessage(roomId: string, options: SendRoomMessageOptions): Promise<RoomMessage>;
    setLayout(roomId: string, layout: LayoutOption, options?: SetLayoutOptions): Promise<void>;
    end(roomId: string): Promise<void>;
    removeParticipant(roomId: string, participantId: string): Promise<void>;
    transferHost(roomId: string, newHostParticipantId: string): Promise<void>;
    createBreakoutRooms(roomId: string, options: CreateBreakoutRoomsOptions): Promise<BreakoutRoom[]>;
    moveToBreakout(roomId: string, participantId: string, breakoutRoomId: string): Promise<void>;
    closeBreakoutRooms(roomId: string): Promise<void>;
    createPoll(roomId: string, options: CreatePollOptions): Promise<Poll>;
    vote(roomId: string, pollId: string, optionIndex: number): Promise<void>;
    getPollResults(roomId: string, pollId: string): Promise<PollResults>;
    raiseHand(roomId: string): Promise<void>;
    lowerHand(roomId: string): Promise<void>;
    setVideoQuality(roomId: string, settings: VideoQualitySettings): Promise<void>;
    setAdaptiveQuality(roomId: string, enabled: boolean): Promise<void>;
    getStats(roomId: string): Promise<RoomStats>;
    /** @internal */
    _setParticipantStream(roomId: string, participantId: string, stream: MediaStream): void;
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
    load(): Promise<Contact[]>;
    getAll(): Promise<Contact[]>;
    get(walletAddress: WalletAddress): Promise<Contact | null>;
    has(walletAddress: WalletAddress): Promise<boolean>;
    add(options: AddContactOptions): Promise<Contact>;
    update(options: UpdateContactOptions): Promise<Contact>;
    remove(walletAddress: WalletAddress): Promise<void>;
    on<K extends keyof ContactsBookEvents>(event: K, callback: (payload: ContactsBookEvents[K]) => void): void;
    off<K extends keyof ContactsBookEvents>(event: K, callback?: (payload: ContactsBookEvents[K]) => void): void;
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
 * @module @dial-wtf/client/user-dialer
 */

/**
 * Authenticated user client
 *
 * Provides access to all user-specific SDK features after authentication.
 * Created via `DialClient.asUser()`.
 */
declare class UserDialer {
    private readonly http;
    private session;
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
    constructor(http: HttpClient, session: SessionData, contactsProvider?: IContactsBookProvider, contactsConfig?: ContactsBookConfig, authService?: AuthService);
    /**
     * Replace the contacts book provider at runtime
     *
     * @example
     * ```typescript
     * import { ApiContactsBookProvider } from '@dial-wtf/client';
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
 * import { DialClient } from '@dial-wtf/client';
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
 * @module @dial-wtf/client
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
     * Auto-detect the SIWE/SIWS domain from the current environment.
     * Returns the hostname for browsers, the extension origin for extensions,
     * or 'dial.wtf' as the fallback.
     * @internal
     */
    private detectDomain;
    /**
     * Auto-detect the SIWE/SIWS URI from the current environment.
     * @internal
     */
    private detectUri;
    /**
     * Simple base58 encoding for signatures
     * @internal
     */
    private uint8ArrayToBase58;
}

/**
 * Event Emitter for Dial SDK
 *
 * Provides type-safe event emission for real-time updates.
 * Works in both browser and Node.js environments.
 *
 * @module @dial-wtf/client/event-emitter
 */

/**
 * Type-safe event emitter for Dial SDK events
 */
declare class DialEventEmitter {
    private readonly emitter;
    constructor();
    /**
     * Subscribe to an event
     */
    on<T extends DialEventType>(event: T, listener: EventListener<T>): void;
    /**
     * Subscribe to an event (only fires once)
     */
    once<T extends DialEventType>(event: T, listener: EventListener<T>): void;
    /**
     * Unsubscribe from an event
     */
    off<T extends DialEventType>(event: T, listener?: EventListener<T>): void;
    /**
     * Emit an event
     */
    emit<T extends DialEventType>(event: T, payload: DialEventPayloads[T]): void;
    /**
     * Remove all listeners
     */
    removeAllListeners(event?: DialEventType): void;
    /**
     * Get listener count for an event
     */
    listenerCount(event: DialEventType): number;
}

/**
 * @file contacts-book-local.ts
 * @description LocalContactsBookProvider — IDialStorage-backed contacts storage.
 * @layer Services
 *
 * Default provider that persists contacts per-wallet via IDialStorage (platform-agnostic).
 * Uses BrowserStorage by default in browsers, MemoryStorage as fallback.
 * Works offline with zero backend dependencies.
 *
 * Addresses audit finding C3: no direct localStorage usage — works in
 * Chrome Extension MV3 service workers when given a chrome.storage adapter.
 */

interface LocalContactsBookProviderOptions {
    /** Owner wallet address — used to namespace storage keys */
    walletAddress: WalletAddress;
    /** Storage key prefix (default: 'dial_contacts') */
    storagePrefix?: string;
    /** Custom storage backend (default: BrowserStorage in browsers, MemoryStorage elsewhere) */
    storage?: IDialStorage;
}
declare class LocalContactsBookProvider implements IContactsBookProvider {
    private readonly storageKey;
    private readonly storage;
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
 * API routes. Accepts either an HttpClient instance or a config object
 * so consumers can construct it without internal SDK plumbing (P2-3 fix).
 */

/** Config for constructing an ApiContactsBookProvider without an HttpClient. */
interface ApiContactsBookProviderConfig {
    /** API key for authentication. */
    apiKey?: string;
    /** Base URL of the Dial API (e.g., 'https://api.dial.wtf/v1'). */
    baseUrl: string;
    /** Bearer token for the authenticated session. */
    token: string;
    /** API version prefix (default: 'v1'). */
    apiVersion?: string;
}
declare class ApiContactsBookProvider implements IContactsBookProvider {
    private readonly http;
    private readonly apiVersion;
    /**
     * Create with an existing HttpClient instance (internal SDK usage).
     */
    constructor(http: HttpClient, apiVersion?: string);
    /**
     * Create with a config object (external consumer usage).
     * No need to import or construct HttpClient yourself.
     */
    constructor(config: ApiContactsBookProviderConfig);
    getAll(params?: PaginationParams): Promise<Contact[]>;
    get(walletAddress: WalletAddress): Promise<Contact | null>;
    add(options: AddContactOptions): Promise<Contact>;
    update(options: UpdateContactOptions): Promise<Contact>;
    remove(walletAddress: WalletAddress): Promise<void>;
    has(walletAddress: WalletAddress): Promise<boolean>;
    private endpoint;
}

export { ApiContactsBookProvider, type ApiContactsBookProviderConfig, AuthService, CallsService, ChatService, ConferenceService, ContactsBook, DialClient, DialEventEmitter, HttpClient, LocalContactsBookProvider, type LocalContactsBookProviderOptions, PartyLinesService, type ProfileSearchResult, ProfileService, RegistryService, UserDialer, VoicemailService };
