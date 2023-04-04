import { ObservableStore } from '@metamask/obs-store';

declare module '@metamask/obs-store' {
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
