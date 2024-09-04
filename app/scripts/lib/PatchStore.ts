import { createProjectLogger } from '@metamask/utils';
import { Patch } from 'immer';
import { v4 as uuid } from 'uuid';
import ComposableObservableStore from './ComposableObservableStore';

const log = createProjectLogger('patch-store');

const IGNORE_KEYS = ['snapStates', 'unencryptedSnapStates', 'vault'];

export class PatchStore {
  private id: string;

  private observableStore: ComposableObservableStore;

  private pendingPatches: Patch[] = [];

  private listener: (request: {
    controllerKey: string;
    oldState: Record<string, unknown>;
    newState: Record<string, unknown>;
  }) => void;

  constructor(observableStore: ComposableObservableStore) {
    this.id = uuid();
    this.observableStore = observableStore;
    this.listener = this._onStateChange.bind(this);

    this.observableStore.on('stateChange', this.listener);

    log('Created', this.id);
  }

  flushPendingPatches() {
    const patches = this.pendingPatches;
    this.pendingPatches = [];

    patches.forEach((patch) => {
      log('Flushed', patch.path.join('.'), this.id, patch);
    });

    return patches;
  }

  destroy() {
    this.observableStore.removeListener('stateChange', this.listener);
    log('Destroyed', this.id);
  }

  private _onStateChange({
    oldState,
    newState,
  }: {
    controllerKey: string;
    oldState: Record<string, unknown>;
    newState: Record<string, unknown>;
  }) {
    const patches = this._generatePatches(oldState, newState);
    const isInitialized = Boolean(newState.vault);

    if (isInitialized) {
      patches.push({
        op: 'replace',
        path: ['isInitialized'],
        value: isInitialized,
      });
    }

    const finalPatches = patches.filter(
      (patch) => !IGNORE_KEYS.includes((patch.path as string[])?.[0]),
    );

    if (!finalPatches.length) {
      return;
    }

    finalPatches.forEach((patch) => {
      log('Added', patch.path.join('.'), this.id, patch);
    });

    this.pendingPatches.push(...finalPatches);
  }

  private _generatePatches(
    oldState: Record<string, unknown>,
    newState: Record<string, unknown>,
  ): Patch[] {
    return Object.keys(newState)
      .map((key) => {
        const oldData = oldState[key];
        const newData = newState[key];

        if (oldData === newData) {
          return null;
        }

        return {
          op: 'replace',
          path: [key],
          value: newData,
        };
      })
      .filter(Boolean) as Patch[];
  }
}
