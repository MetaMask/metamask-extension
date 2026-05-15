import React from 'react';
import { render, screen, act } from '@testing-library/react';
import * as riveReactCanvas from '@rive-app/react-canvas';
import * as riveWasmContext from '../../../contexts/rive-wasm';
import FoxAppearAnimation from './fox-appear-animation';

const mockStartFire = jest.fn();
const mockWiggleFire = jest.fn();
const mockLoaderFire = jest.fn();

const mockInputs = [
  { name: 'Start', fire: mockStartFire },
  { name: 'Wiggle', fire: mockWiggleFire },
  { name: 'Loader2', fire: mockLoaderFire },
];

jest.mock('@rive-app/react-canvas', () => ({
  useRive: jest.fn(),
  useRiveFile: jest.fn(),
  Layout: jest.fn(),
  Fit: { Contain: 'contain' },
  Alignment: { BottomCenter: 'bottomCenter' },
}));

jest.mock('../../../contexts/rive-wasm', () => ({
  useRiveWasmContext: jest.fn(),
  useRiveWasmFile: jest.fn(),
}));

const mockedRive = jest.mocked(riveReactCanvas);
const mockedWasm = jest.mocked(riveWasmContext);

function setDefaultMocks(rive: Record<string, jest.Mock> | null = null) {
  mockedWasm.useRiveWasmContext.mockReturnValue({
    isWasmReady: true,
    loading: false,
    error: undefined,
    urlBufferMap: {},
    setUrlBufferCache: jest.fn(),
    animationCompleted: {},
    setIsAnimationCompleted: jest.fn(),
  });
  mockedWasm.useRiveWasmFile.mockReturnValue({
    buffer: new ArrayBuffer(8),
    error: undefined,
    loading: false,
  });
  mockedRive.useRiveFile.mockReturnValue({
    riveFile: { name: 'mock' } as unknown as riveReactCanvas.RiveFile,
    status: 'success',
  });
  mockedRive.useRive.mockReturnValue({
    rive,
    RiveComponent: () => <canvas data-testid="rive-component" />,
  } as unknown as ReturnType<typeof riveReactCanvas.useRive>);
}

function createRiveInstance() {
  return {
    play: jest.fn(),
    cleanup: jest.fn(),
    resizeToCanvas: jest.fn(),
    stateMachineInputs: jest.fn(() => mockInputs),
  };
}

describe('FoxAppearAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setDefaultMocks();
  });

  it('renders the Rive component when all resources are ready', () => {
    render(<FoxAppearAnimation />);

    expect(screen.getByTestId('rive-component')).toBeInTheDocument();
  });

  it('renders a placeholder with spinner when resources are not ready and isLoader is true', () => {
    mockedWasm.useRiveWasmContext.mockReturnValue({
      isWasmReady: false,
      loading: true,
      error: undefined,
      urlBufferMap: {},
      setUrlBufferCache: jest.fn(),
      animationCompleted: {},
      setIsAnimationCompleted: jest.fn(),
    });

    render(<FoxAppearAnimation isLoader />);

    expect(screen.queryByTestId('rive-component')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('fires Start trigger and plays the animation on mount', () => {
    const riveInstance = createRiveInstance();
    setDefaultMocks(riveInstance);

    render(<FoxAppearAnimation />);

    expect(mockStartFire).toHaveBeenCalled();
    expect(riveInstance.play).toHaveBeenCalled();
  });

  it('fires Wiggle and Loader2 triggers when skipTransition and isLoader are true', () => {
    const riveInstance = createRiveInstance();
    setDefaultMocks(riveInstance);

    render(<FoxAppearAnimation skipTransition isLoader />);

    expect(mockWiggleFire).toHaveBeenCalled();
    expect(mockStartFire).not.toHaveBeenCalled();
    expect(mockLoaderFire).toHaveBeenCalled();
  });

  it('syncs canvas size on window resize and cleans up the listener on unmount', () => {
    const riveInstance = createRiveInstance();
    setDefaultMocks(riveInstance);
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(<FoxAppearAnimation />);

    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(riveInstance.resizeToCanvas).toHaveBeenCalled();

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
