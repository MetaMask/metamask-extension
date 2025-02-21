import type {
  BackgroundStateProxy,
  MemStoreControllersComposedState,
} from '../../../shared/types/background';

export const initialBackgroundState: Omit<
  BackgroundStateProxy,
  keyof MemStoreControllersComposedState
> &
  Partial<{
    [ControllerName in keyof MemStoreControllersComposedState]: Partial<
      MemStoreControllersComposedState[ControllerName]
    >;
  }> = {
  isInitialized: false,
} as const;
