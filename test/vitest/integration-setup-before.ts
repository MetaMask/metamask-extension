import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder,
} from 'node:util';
import { vi } from 'vitest';

const TextEncoderUint8Array = new NodeTextEncoder().encode('').constructor;

Object.defineProperty(globalThis, 'Uint8Array', {
  value: TextEncoderUint8Array,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'TextEncoder', {
  value: NodeTextEncoder,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'TextDecoder', {
  value: NodeTextDecoder,
  configurable: true,
  writable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'Uint8Array', {
    value: TextEncoderUint8Array,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'TextEncoder', {
    value: NodeTextEncoder,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'TextDecoder', {
    value: NodeTextDecoder,
    configurable: true,
    writable: true,
  });
}

vi.mock('../../ui/components/component-library/lottie-animation', () => ({
  LottieAnimation: () => null,
}));

// Rive WASM URL resolution relies on browser asset handling and can throw in
// Vitest integration boot. Mock the context to keep integration tests focused
// on UI logic instead of runtime WASM loading.
vi.mock('../../ui/contexts/rive-wasm', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({ children }: { children: unknown }) => children,
    useRiveWasmReady: () => ({
      isWasmReady: true,
      loading: false,
      error: undefined,
    }),
    useRiveWasmContext: () => ({
      isWasmReady: true,
      loading: false,
      error: undefined,
      urlBufferMap: {},
      setUrlBufferCache: () => undefined,
      animationCompleted: {},
      setIsAnimationCompleted: () => undefined,
    }),
    useRiveWasmFile: () => ({
      buffer: undefined,
      loading: false,
      error: undefined,
    }),
  };
});
