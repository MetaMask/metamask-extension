import { Json, createProjectLogger } from '@metamask/utils';
import { Patch } from 'immer';
import { v4 as uuid } from 'uuid';
import { uniq } from 'lodash';
import ComposableObservableStore from './ComposableObservableStore';
import { sanitizePatches, sanitizeUIState } from './state-utils';

const log = createProjectLogger('patch-store');

export class PatchStore {
  private id: string;

  private observableStore: ComposableObservableStore;

  private pendingPatches: Patch[] = [];

  private listener: (request: {
    controllerKey: string;
    oldState: Record<string, Json>;
    newState: Record<string, Json>;
  }) => void;

  constructor(observableStore: ComposableObservableStore) {
    this.id = uuid();
    this.observableStore = observableStore;
    this.listener = this._onStateChange.bind(this);

    this.observableStore.on('stateChange', this.listener);

    log('Created', this.id);
  }

  flushPendingPatches(): Patch[] {
    const patches = this.pendingPatches;

    this.pendingPatches = [];

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
    newState,
    oldState,
    patches: eventPatches,
  }: {
    controllerKey: string;
    oldState: Record<string, Json>;
    newState: Record<string, Json>;
    patches?: Patch[];
  }) {
    const sanitizedNewState = eventPatches
      ? newState
      : sanitizeUIState(newState);

    const normalizedPatches = this._normalizeEventPatches(
      eventPatches,
      oldState,
    );

    const sanitizedPatches = normalizedPatches
      ? sanitizePatches(normalizedPatches)
      : undefined;

    const patches =
      sanitizedPatches ?? this._generatePatches(oldState, sanitizedNewState);

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

      this.pendingPatches.push(patch);

      log('Added', path, this.id, patch);
    }
  }

  private _generatePatches(
    oldState: Record<string, Json>,
    newState: Record<string, Json>,
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

  private _normalizeEventPatches(
    eventPatches: Patch[] | undefined,
    oldState: Record<string, Json>,
  ): Patch[] | undefined {
    return eventPatches?.flatMap((patch) => {
      if (patch.path.length > 0) {
        return [patch];
      }

      const stateProperties = uniq([
        ...Object.keys(oldState),
        ...Object.keys(patch.value),
      ]);

      return stateProperties.map((key) => ({
        op: key in patch.value ? 'replace' : 'remove',
        path: [key],
        ...(key in patch.value ? { value: patch.value[key] } : {}),
      }));
    });
  }
}
