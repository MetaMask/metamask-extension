import { createProjectLogger } from '@metamask/utils';
import { Patch } from 'immer';
import { v4 as uuid } from 'uuid';
import ComposableObservableStore from './ComposableObservableStore';
import { sanitizeUIState } from './state-utils';

const log = createProjectLogger('patch-store');

export class PatchStore {
  private id: string;

  private observableStore: ComposableObservableStore;

  private pendingPatches: Map<string, Patch> = new Map();

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

  flushPendingPatches(): Patch[] {
    const patches = [...this.pendingPatches.values()];

    this.pendingPatches.clear();

    for (const patch of patches) {
      log('Flushed', patch.path.join('.'), this.id, patch);
    }

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
    const sanitizedNewState = sanitizeUIState(newState);
    const patches = this._generatePatches(oldState, sanitizedNewState);
    const isInitialized = Boolean(newState.vault);

    if (isInitialized) {
      patches.push({
        op: 'replace',
        path: ['isInitialized'],
        value: isInitialized,
      });
    }

    if (!patches.length) {
      return;
    }

    for (const patch of patches) {
      const path = patch.path.join('.');

      this.pendingPatches.set(path, patch);

      log('Updated', path, this.id, patch);
    }
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
