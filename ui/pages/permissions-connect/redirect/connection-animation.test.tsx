import React from 'react';
import { render } from '@testing-library/react';
import * as riveReactCanvas from '@rive-app/react-canvas';
import ConnectionAnimation from './connection-animation';

jest.mock('@rive-app/react-canvas', () => ({
  useRive: jest.fn(() => ({
    rive: null,
    RiveComponent: () => <div data-testid="rive-component" />,
  })),
  useRiveFile: jest.fn(() => ({
    riveFile: {},
    status: 'success',
  })),
  Layout: jest.fn(),
  Fit: { Contain: 'contain' },
  Alignment: { Center: 'center' },
  decodeImage: jest.fn(),
  ImageAsset: jest.fn(),
}));

const mockedRive = riveReactCanvas as jest.Mocked<typeof riveReactCanvas>;

jest.mock('../../../contexts/rive-wasm', () => ({
  useRiveWasmContext: jest.fn(() => ({
    isWasmReady: true,
    error: undefined,
  })),
  useRiveWasmFile: jest.fn(() => ({
    buffer: new ArrayBuffer(8),
    loading: false,
    error: undefined,
  })),
}));

describe('ConnectionAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ConnectionAnimation />);
    expect(container.querySelector('.connection-animation')).toBeInTheDocument();
  });

  it('renders with iconUrl prop', () => {
    const { container } = render(
      <ConnectionAnimation iconUrl="https://example.com/icon.png" />,
    );
    expect(container.querySelector('.connection-animation')).toBeInTheDocument();
  });

  it('renders empty container when WASM is not ready', () => {
    const mockedWasm = jest.requireMock('../../../contexts/rive-wasm');
    mockedWasm.useRiveWasmContext.mockReturnValue({
      isWasmReady: false,
      error: undefined,
    });

    const { container } = render(<ConnectionAnimation />);
    expect(container.querySelector('.connection-animation')).toBeInTheDocument();
  });

  it('renders empty container when buffer is loading', () => {
    const mockedWasm = jest.requireMock('../../../contexts/rive-wasm');
    mockedWasm.useRiveWasmContext.mockReturnValue({
      isWasmReady: true,
      error: undefined,
    });
    mockedWasm.useRiveWasmFile.mockReturnValue({
      buffer: undefined,
      loading: true,
      error: undefined,
    });

    const { container } = render(<ConnectionAnimation />);
    expect(container.querySelector('.connection-animation')).toBeInTheDocument();
  });

  it('fires connected trigger when isConnected becomes true', () => {
    const mockedWasm = jest.requireMock('../../../contexts/rive-wasm');
    mockedWasm.useRiveWasmContext.mockReturnValue({
      isWasmReady: true,
      error: undefined,
    });
    mockedWasm.useRiveWasmFile.mockReturnValue({
      buffer: new ArrayBuffer(8),
      loading: false,
      error: undefined,
    });

    const mockFire = jest.fn();
    const mockRiveInstance = {
      stateMachineInputs: jest.fn(() => [{ name: 'connected', fire: mockFire }]),
      resizeToCanvas: jest.fn(),
    };
    mockedRive.useRive.mockReturnValue({
      rive: mockRiveInstance,
      RiveComponent: () => <div data-testid="rive-component" />,
    } as unknown as ReturnType<typeof riveReactCanvas.useRive>);

    const { rerender } = render(<ConnectionAnimation isConnected={false} />);

    expect(mockFire).not.toHaveBeenCalled();

    rerender(<ConnectionAnimation isConnected />);

    expect(mockRiveInstance.stateMachineInputs).toHaveBeenCalledWith(
      'State Machine 1',
    );
    expect(mockFire).toHaveBeenCalled();
  });

  it('calls onConnectedAnimationComplete after 800ms when connected', () => {
    jest.useFakeTimers();

    const mockedWasm = jest.requireMock('../../../contexts/rive-wasm');
    mockedWasm.useRiveWasmContext.mockReturnValue({
      isWasmReady: true,
      error: undefined,
    });
    mockedWasm.useRiveWasmFile.mockReturnValue({
      buffer: new ArrayBuffer(8),
      loading: false,
      error: undefined,
    });

    const mockFire = jest.fn();
    const mockRiveInstance = {
      stateMachineInputs: jest.fn(() => [{ name: 'connected', fire: mockFire }]),
      resizeToCanvas: jest.fn(),
    };
    mockedRive.useRive.mockReturnValue({
      rive: mockRiveInstance,
      RiveComponent: () => <div data-testid="rive-component" />,
    } as unknown as ReturnType<typeof riveReactCanvas.useRive>);

    const onComplete = jest.fn();
    render(
      <ConnectionAnimation
        isConnected
        onConnectedAnimationComplete={onComplete}
      />,
    );

    expect(onComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(800);

    expect(onComplete).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
