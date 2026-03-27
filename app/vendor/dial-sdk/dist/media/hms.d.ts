import { IMediaProvider, MediaSessionCredentials, MediaProviderConfig, MediaConnectionState, MediaPeer, MediaProviderEvents } from './index.js';

/**
 * @file hms-media-provider.ts
 * @description HMS (100ms.live) implementation of IMediaProvider.
 * @layer Services
 *
 * Uses @100mslive/hms-video-store (vanilla JS, NOT the React SDK) to implement
 * the IMediaProvider interface. This keeps the provider framework-agnostic.
 *
 * The React SDK (@100mslive/react-sdk) should only be used in the React hooks
 * layer or directly by consumers building React apps.
 *
 * NOTE: This is for multi-party conference rooms only. 1:1 P2P calls use
 * PeerJS via CallsService — a completely separate system.
 */

type EventCallback<K extends keyof MediaProviderEvents> = (payload: MediaProviderEvents[K]) => void;
/**
 * HMS implementation of the IMediaProvider interface.
 *
 * Uses the vanilla @100mslive/hms-video-store SDK under the hood.
 * Subscribe to events via on()/off() for reactive updates.
 */
declare class HMSMediaProvider implements IMediaProvider {
    private hmsStore;
    private hmsActions;
    private listeners;
    private unsubscribers;
    private connectionState;
    constructor();
    connect(credentials: MediaSessionCredentials, config?: MediaProviderConfig): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionState(): MediaConnectionState;
    setLocalAudioEnabled(enabled: boolean): Promise<void>;
    setLocalVideoEnabled(enabled: boolean): Promise<void>;
    startScreenShare(): Promise<void>;
    stopScreenShare(): Promise<void>;
    getPeers(): MediaPeer[];
    getLocalPeer(): MediaPeer | null;
    getAudioDevices(): Promise<MediaDeviceInfo[]>;
    getVideoDevices(): Promise<MediaDeviceInfo[]>;
    setAudioDevice(deviceId: string): Promise<void>;
    setVideoDevice(deviceId: string): Promise<void>;
    on<K extends keyof MediaProviderEvents>(event: K, callback: EventCallback<K>): void;
    off<K extends keyof MediaProviderEvents>(event: K, callback: EventCallback<K>): void;
    private emit;
    private subscribeToStoreUpdates;
    private cleanupSubscriptions;
    private mapPeer;
    private mapTrack;
}

export { HMSMediaProvider };
