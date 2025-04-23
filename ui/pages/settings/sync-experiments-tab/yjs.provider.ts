import { applyUpdate, Doc } from 'yjs';
import { bytesToHex, hexToBytes } from '@metamask/utils';
import { sha256 } from '@noble/hashes/sha256';
import { uuid4 } from '@sentry/utils';
import {
  userStorageGetAllItems,
  userStorageSetItems,
} from '../../../store/actions';

export class YjsProvider {
  doc: Doc;

  pendingUpdates: Uint8Array[];

  processedUpdates: Set<string>;

  private readonly namespace: string;

  private readonly providerID: string;

  constructor(doc: Doc, namespace: string, providerID?: string) {
    this.doc = doc;
    this.pendingUpdates = [];
    this.processedUpdates = new Set<string>();
    this.namespace = namespace;
    this.providerID = providerID || uuid4();
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin !== this.providerID) {
        console.log(
          `GIGEL store pending update from ${origin} with ${update.length} bytes`,
        );
        this.pendingUpdates.push(update);
      }
    });
  }

  processUpdates(updates: Uint8Array[]) {
    if (!Array.isArray(updates) || updates.length === 0) {
      return 0;
    }

    let updatesApplied = 0;

    updates.forEach((updateData) => {
      const updateId = bytesToHex(sha256(updateData));
      try {
        // Only apply if we haven't seen this update ID before
        if (updateId && !this.processedUpdates.has(updateId)) {
          console.log('GIGEL applying update', updateId);
          // Apply the update to the document
          applyUpdate(this.doc, updateData, this.providerID);

          updatesApplied += 1;

          // Track the processed update
          this.processedUpdates.add(updateId);
        }
      } catch (err) {
        console.error(`GIGEL Provider error applying update:`, err);
      }
    });

    return updatesApplied;
  }

  handlePush = async () => {
    const entries = this.pendingUpdates.map((update) => {
      const key = bytesToHex(sha256(update));
      const value = bytesToHex(update);
      return [key, value];
    });
    const itemsToPush: Record<string, string> = Object.fromEntries(entries);
    await userStorageSetItems(this.namespace, itemsToPush);
  };

  handlePull = async () => {
    const result = await userStorageGetAllItems(this.namespace);
    const rawUpdates = result.map(hexToBytes);
    this.processUpdates(rawUpdates);
    return result;
  };
}
