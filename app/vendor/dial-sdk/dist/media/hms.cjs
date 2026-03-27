'use strict';

var hmsVideoStore = require('@100mslive/hms-video-store');

/* @dial-wtf/sdk - Web3-native communication primitives */

var HMSMediaProvider = class {
  hmsStore;
  hmsActions;
  listeners = /* @__PURE__ */ new Map();
  unsubscribers = [];
  connectionState = "disconnected";
  constructor() {
    const hms = new hmsVideoStore.HMSReactiveStore();
    this.hmsStore = hms.getStore();
    this.hmsActions = hms.getActions();
  }
  // ── Connection lifecycle ──────────────────────────────────────────
  async connect(credentials, config) {
    this.connectionState = "connecting";
    this.emit("connection-state-changed", { state: "connecting" });
    try {
      await this.hmsActions.join({
        authToken: credentials.authToken,
        userName: credentials.userName,
        settings: {
          isAudioMuted: config?.initialAudio === false,
          isVideoMuted: config?.initialVideo !== true
        }
      });
      this.connectionState = "connected";
      this.emit("connection-state-changed", { state: "connected" });
      this.subscribeToStoreUpdates();
    } catch (err) {
      this.connectionState = "failed";
      this.emit("connection-state-changed", { state: "failed" });
      this.emit("error", {
        code: "HMS_JOIN_FAILED",
        message: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
  async disconnect() {
    this.cleanupSubscriptions();
    try {
      await this.hmsActions.leave();
    } finally {
      this.connectionState = "disconnected";
      this.emit("connection-state-changed", { state: "disconnected" });
    }
  }
  getConnectionState() {
    return this.connectionState;
  }
  // ── Local track controls ──────────────────────────────────────────
  async setLocalAudioEnabled(enabled) {
    await this.hmsActions.setLocalAudioEnabled(enabled);
  }
  async setLocalVideoEnabled(enabled) {
    await this.hmsActions.setLocalVideoEnabled(enabled);
  }
  async startScreenShare() {
    await this.hmsActions.setScreenShareEnabled(true);
  }
  async stopScreenShare() {
    await this.hmsActions.setScreenShareEnabled(false);
  }
  // ── Peers & tracks ────────────────────────────────────────────────
  getPeers() {
    const hmsPeers = this.hmsStore.getState(hmsVideoStore.selectPeers);
    return hmsPeers.map((p) => this.mapPeer(p));
  }
  getLocalPeer() {
    const localPeer = this.hmsStore.getState(hmsVideoStore.selectLocalPeer);
    return localPeer ? this.mapPeer(localPeer) : null;
  }
  // ── Device management ─────────────────────────────────────────────
  async getAudioDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "audioinput");
  }
  async getVideoDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput");
  }
  async setAudioDevice(deviceId) {
    await this.hmsActions.setAudioSettings({ deviceId });
  }
  async setVideoDevice(deviceId) {
    await this.hmsActions.setVideoSettings({ deviceId });
  }
  // ── Events ────────────────────────────────────────────────────────
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
  }
  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }
  // ── Private helpers ───────────────────────────────────────────────
  emit(event, payload) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    for (const cb of callbacks) {
      try {
        cb(payload);
      } catch (err) {
        console.warn(`[HMSMediaProvider] Error in ${event} listener:`, err);
      }
    }
  }
  subscribeToStoreUpdates() {
    let previousPeerIds = /* @__PURE__ */ new Set();
    const unsubPeers = this.hmsStore.subscribe((peers) => {
      const currentPeerIds = new Set(peers.map((p) => p.id));
      for (const peer of peers) {
        if (!previousPeerIds.has(peer.id)) {
          this.emit("peer-joined", { peer: this.mapPeer(peer) });
        }
      }
      for (const prevId of previousPeerIds) {
        if (!currentPeerIds.has(prevId)) {
          this.emit("peer-left", {
            peer: { id: prevId, name: "", role: "", isLocal: false }
          });
        }
      }
      previousPeerIds = currentPeerIds;
    }, hmsVideoStore.selectPeers);
    this.unsubscribers.push(unsubPeers);
    const unsubRoom = this.hmsStore.subscribe((roomState) => {
      if (roomState === hmsVideoStore.HMSRoomState.Reconnecting) {
        this.connectionState = "reconnecting";
        this.emit("connection-state-changed", { state: "reconnecting" });
      } else if (roomState === hmsVideoStore.HMSRoomState.Connected && this.connectionState === "reconnecting") {
        this.connectionState = "connected";
        this.emit("connection-state-changed", { state: "connected" });
      } else if (roomState === hmsVideoStore.HMSRoomState.Disconnected || roomState === hmsVideoStore.HMSRoomState.Failed) {
        const state = roomState === hmsVideoStore.HMSRoomState.Failed ? "failed" : "disconnected";
        this.connectionState = state;
        this.emit("connection-state-changed", { state });
      }
    }, hmsVideoStore.selectRoomState);
    this.unsubscribers.push(unsubRoom);
  }
  cleanupSubscriptions() {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }
  mapPeer(hmsPeer) {
    return {
      id: hmsPeer.id,
      name: hmsPeer.name,
      role: hmsPeer.roleName ?? "",
      isLocal: hmsPeer.isLocal,
      audioTrack: hmsPeer.audioTrack ? this.mapTrack(hmsPeer.audioTrack, hmsPeer.id, "audio") : void 0,
      videoTrack: hmsPeer.videoTrack ? this.mapTrack(hmsPeer.videoTrack, hmsPeer.id, "video") : void 0,
      screenTrack: void 0
    };
  }
  mapTrack(trackId, peerId, kind) {
    return {
      id: trackId,
      peerId,
      kind,
      source: "regular",
      enabled: true
    };
  }
};

exports.HMSMediaProvider = HMSMediaProvider;
//# sourceMappingURL=hms.cjs.map
//# sourceMappingURL=hms.cjs.map