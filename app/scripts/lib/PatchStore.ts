import { createProjectLogger } from '@metamask/utils';
import { Patch, produceWithPatches } from 'immer';
import { v4 as uuid } from 'uuid';
import ComposableObservableStore from './ComposableObservableStore';

const log = createProjectLogger('patch-store');

export class PatchStore {
  #id: string;

  #observableStore: ComposableObservableStore;

  #pendingPatches: Patch[] = [];

  #listener: (request: {
    controllerKey: string;
    oldState: Record<string, unknown>;
    newState: Record<string, unknown>;
  }) => void;

  constructor(observableStore: ComposableObservableStore) {
    this.#id = uuid();
    this.#observableStore = observableStore;
    this.#listener = this.#onStateChange.bind(this);

    this.#observableStore.on('stateChange', this.#listener);

    log('Created', this.#id);
  }

  flushPendingPatches() {
    const patches = this.#pendingPatches;
    this.#pendingPatches = [];

    patches.forEach((patch) => {
      log('Flushed', patch.path.join('.'), this.#id, patch);
    });

    return patches;
  }

  destroy() {
    this.#observableStore.removeListener('stateChange', this.#listener);
    log('Destroyed', this.#id);
  }

  #onStateChange({
    oldState,
    newState,
  }: {
    controllerKey: string;
    oldState: Record<string, unknown>;
    newState: Record<string, unknown>;
  }) {
    const [, patches] = produceWithPatches<Record<string, unknown>>(
      oldState,
      (draft) => {
        for (const key of Object.keys(newState)) {
          const oldData = draft[key];
          const newData = newState[key];

          if (oldData !== newData) {
            draft[key] = newData;
          }
        }
      },
    );

    if (!patches.length) {
      return;
    }

    patches.forEach((patch) => {
      log('Added', patch.path.join('.'), this.#id, patch);
    });

    this.#pendingPatches.push(...patches);
  }
}
