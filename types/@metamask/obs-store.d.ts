declare module '@metamask/obs-store' {
  import SafeEventEmitter from '@metamask/safe-event-emitter';

  export class ObservableStore<State> extends SafeEventEmitter {
    private _state: State;

    constructor(initState?: State);

    getState(): State;

    putState(newState: State): void;

    updateState(partialState: Partial<State>): void;

    subscribe(handler: (state: State) => void): void;

    unsubscribe(handler: (state: State) => void): void;

    _getState(): State;

    _putState(newState: State): void;
  }

  export class ComposedStore<
    CompositeState,
  > extends ObservableStore<CompositeState> {
    _children: CompositeState;

    constructor(children: {
      [K in keyof CompositeState]: ObservableStore<CompositeState[K]>;
    });

    _addChild(
      childKey: keyof CompositeState,
      child: ObservableStore<State[keyof CompositeState]>,
    ): void;
  }
}
