import React from 'react';
import { render, screen } from '@testing-library/react';
import * as riveReactCanvas from '@rive-app/react-canvas';
import * as riveWasmContext from '../../../contexts/rive-wasm';
import MetamaskWordMarkAnimation from './metamask-wordmark-animation';

jest.mock('@rive-app/react-canvas', () => ({
  useRive: jest.fn(),
  Layout: jest.fn(),
  Fit: { Contain: 'contain' },
  Alignment: { Center: 'center' },
}));

jest.mock('../../../contexts/rive-wasm', () => ({
  useRiveWasmContext: jest.fn(),
  useRiveWasmFile: jest.fn(),
}));

jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

const mockedRive = jest.mocked(riveReactCanvas);
const mockedWasm = jest.mocked(riveWasmContext);

function setDefaultMocks({
  isWasmReady = true,
  buffer = new ArrayBuffer(8),
  bufferLoading = false,
  wasmError,
  bufferError,
}: {
  isWasmReady?: boolean;
  buffer?: ArrayBuffer | undefined;
  bufferLoading?: boolean;
  wasmError?: Error;
  bufferError?: Error;
} = {}) {
  mockedWasm.useRiveWasmContext.mockReturnValue({
    isWasmReady,
    loading: false,
    error: wasmError,
    animationCompleted: {},
    setIsAnimationCompleted: jest.fn(),
  });
  mockedWasm.useRiveWasmFile.mockReturnValue({
    buffer,
    error: bufferError,
    loading: bufferLoading,
  });
  mockedRive.useRive.mockReturnValue({
    rive: null,
    RiveComponent: () => <canvas data-testid="rive-component" />,
  } as unknown as ReturnType<typeof riveReactCanvas.useRive>);
}

describe('MetamaskWordMarkAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setDefaultMocks();
  });

  it('renders the Rive component when WASM and buffer are ready', () => {
    render(<MetamaskWordMarkAnimation setIsAnimationComplete={jest.fn()} />);

    expect(screen.getByTestId('metamask-wordmark-rive')).toBeInTheDocument();
    expect(mockedRive.useRive).toHaveBeenCalled();
  });

  it('renders the fox fallback while WASM is not ready', () => {
    setDefaultMocks({ isWasmReady: false });

    render(<MetamaskWordMarkAnimation setIsAnimationComplete={jest.fn()} />);

    expect(
      screen.getByTestId('metamask-wordmark-fallback'),
    ).toBeInTheDocument();
    expect(mockedRive.useRive).not.toHaveBeenCalled();
  });

  it('renders the fox fallback and completes when WASM fails', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const setIsAnimationComplete = jest.fn();
    setDefaultMocks({
      isWasmReady: false,
      wasmError: new Error('wasm failed'),
    });

    render(
      <MetamaskWordMarkAnimation
        setIsAnimationComplete={setIsAnimationComplete}
      />,
    );

    expect(
      screen.getByTestId('metamask-wordmark-fallback'),
    ).toBeInTheDocument();
    expect(mockedRive.useRive).not.toHaveBeenCalled();
    expect(setIsAnimationComplete).toHaveBeenCalledWith(true);
    consoleErrorSpy.mockRestore();
  });

  it('does not mark the session animation complete on unmount before it starts', () => {
    const setIsAnimationCompleted = jest.fn();
    mockedWasm.useRiveWasmContext.mockReturnValue({
      isWasmReady: true,
      loading: false,
      error: undefined,
      animationCompleted: {},
      setIsAnimationCompleted,
    });

    const { unmount } = render(
      <MetamaskWordMarkAnimation setIsAnimationComplete={jest.fn()} />,
    );

    unmount();

    expect(setIsAnimationCompleted).not.toHaveBeenCalled();
  });
});
