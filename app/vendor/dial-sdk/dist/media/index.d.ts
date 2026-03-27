/**
 * @file media.ts
 * @description Media provider types for real-time audio/video in conference rooms.
 * @layer Types
 *
 * These types define the pluggable media provider abstraction used by
 * ConferenceService for multi-party rooms and party lines via HMS (100ms.live).
 *
 * NOTE: This is NOT related to 1:1 P2P calls. P2P calls use PeerJS with a
 * separate WebRTC flow managed by CallsService. The media provider layer here
 * is exclusively for multi-party conference rooms backed by an SFU (HMS).
 */
/** Media connection state machine */
type MediaConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
/** A single media track (audio or video) */
interface MediaTrack {
    /** Provider-assigned track ID */
    id: string;
    /** ID of the peer who owns this track */
    peerId: string;
    /** Audio or video */
    kind: 'audio' | 'video';
    /** Regular camera/mic or screen share */
    source: 'regular' | 'screen';
    /** Whether the track is currently enabled (unmuted / video on) */
    enabled: boolean;
}
/** A peer in the media session */
interface MediaPeer {
    /** Provider-assigned peer ID */
    id: string;
    /** Display name */
    name: string;
    /** Provider role (e.g. 'host', 'guest') */
    role: string;
    /** Whether this is the local user */
    isLocal: boolean;
    /** Audio track, if publishing */
    audioTrack?: MediaTrack;
    /** Camera video track, if publishing */
    videoTrack?: MediaTrack;
    /** Screen share track, if publishing */
    screenTrack?: MediaTrack;
}
/** Credentials for connecting to a media session (returned by backend join) */
interface MediaSessionCredentials {
    /** HMS auth token (short-lived, room-scoped) */
    authToken: string;
    /** Display name for the user in the media session */
    userName: string;
    /** Optional room ID for provider-side routing */
    roomId?: string;
}
/** Configuration for media provider connection */
interface MediaProviderConfig {
    /** Start with microphone enabled (default: true) */
    initialAudio?: boolean;
    /** Start with camera enabled (default: false) */
    initialVideo?: boolean;
    /** Video capture settings */
    videoSettings?: {
        width?: number;
        height?: number;
        frameRate?: number;
        facingMode?: 'user' | 'environment';
    };
}
/** Event map for media provider — subscribe via provider.on() */
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
 * The ConferenceService delegates real-time media operations to this interface
 * while keeping REST signaling as the source of truth for server state.
 *
 * NOTE: This is for multi-party conference rooms only. 1:1 P2P calls use
 * PeerJS via CallsService — a completely separate system.
 */
interface IMediaProvider {
    /** Connect to a media session using credentials from the backend join response */
    connect(credentials: MediaSessionCredentials, config?: MediaProviderConfig): Promise<void>;
    /** Disconnect from the media session */
    disconnect(): Promise<void>;
    /** Get current connection state */
    getConnectionState(): MediaConnectionState;
    /** Enable or disable local audio (mic) */
    setLocalAudioEnabled(enabled: boolean): Promise<void>;
    /** Enable or disable local video (camera) */
    setLocalVideoEnabled(enabled: boolean): Promise<void>;
    /** Start sharing screen */
    startScreenShare(): Promise<void>;
    /** Stop sharing screen */
    stopScreenShare(): Promise<void>;
    /** Get all peers in the session (including local) */
    getPeers(): MediaPeer[];
    /** Get the local peer, or null if not connected */
    getLocalPeer(): MediaPeer | null;
    /** Enumerate available audio input devices */
    getAudioDevices(): Promise<MediaDeviceInfo[]>;
    /** Enumerate available video input devices */
    getVideoDevices(): Promise<MediaDeviceInfo[]>;
    /** Switch to a specific audio input device */
    setAudioDevice(deviceId: string): Promise<void>;
    /** Switch to a specific video input device */
    setVideoDevice(deviceId: string): Promise<void>;
    /** Subscribe to a media provider event */
    on<K extends keyof MediaProviderEvents>(event: K, callback: (payload: MediaProviderEvents[K]) => void): void;
    /** Unsubscribe from a media provider event */
    off<K extends keyof MediaProviderEvents>(event: K, callback: (payload: MediaProviderEvents[K]) => void): void;
}

export type { IMediaProvider, MediaConnectionState, MediaPeer, MediaProviderConfig, MediaProviderEvents, MediaSessionCredentials, MediaTrack };
