import { KeyManager } from "./key-manager";

export type QrSyncControllerInitOptions = {
  keyManager: KeyManager;
};

export type QrSyncPayload<DataType = undefined> = {
  type: "init-sync-session",
  data?: DataType;
}

export type QrSyncControllerState = {
  // todo
};


