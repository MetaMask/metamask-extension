import { createProjectLogger, getKnownPropertyNames } from '@metamask/utils';
import { Patch } from 'immer';
import { v4 as uuid } from 'uuid';
import { MemStoreControllersComposedState } from '../../../shared/types/metamask';
import ComposableObservableStore from './ComposableObservableStore';
import { sanitizeUIState } from './state-utils';

const log = createProjectLogger('patch-store');

export class PatchStore<
  ControllerKey extends keyof MemStoreControllersComposedState,
> {
  private id: string;

  private observableStore: ComposableObservableStore;

  private pendingPatches: Map<string, Patch> = new Map();

  private listener: (request: {
    controllerKey: ControllerKey;
    oldState: MemStoreControllersComposedState[ControllerKey];
    newState: MemStoreControllersComposedState[ControllerKey];
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
    controllerKey,
    oldState,
    newState,
  }: {
    controllerKey: ControllerKey;
    oldState: MemStoreControllersComposedState[ControllerKey];
    newState: MemStoreControllersComposedState[ControllerKey];
  }) {
    const sanitizedNewState = sanitizeUIState<ControllerKey>({
      [controllerKey]: newState,
    } as Pick<MemStoreControllersComposedState, ControllerKey>);
    const patches = this._generatePatches({
      controllerKey,
      oldState,
      newState: sanitizedNewState[controllerKey],
    });
    const isInitialized = 'vault' in newState && Boolean(newState.vault);

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

  private _generatePatches({
    controllerKey,
    oldState,
    newState,
  }: {
    controllerKey: ControllerKey;
    oldState: MemStoreControllersComposedState[ControllerKey];
    newState: MemStoreControllersComposedState[ControllerKey];
  }): Patch[] {
    return getKnownPropertyNames(newState).reduce<Patch[]>((patches, key) => {
      const oldData = oldState[key as keyof typeof oldState];
      const newData = newState[key as keyof typeof newState];

      if (oldData !== newData) {
        patches.push({
          op: 'replace' as const,
          path: [controllerKey, key],
          value: newData,
        });
      }
      return patches;
    }, []);
  }
}
