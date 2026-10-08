import React, { StrictMode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { RuntimeLoader } from '@rive-app/react-canvas';
import RiveWasmProvider, { useRiveWasmContext, useRiveWasmFile } from '.';

jest.mock('@rive-app/react-canvas', () => ({
  RuntimeLoader: {
    setWasmUrl: jest.fn(),
    awaitInstance: jest.fn(),
  },
}));

const TestAnimation = ({ name }: { name: string }) => {
  const { isWasmReady } = useRiveWasmContext();
  const { buffer } = useRiveWasmFile('test-animation.riv');
  return (
    <div data-testid={name}>{isWasmReady && buffer ? 'ready' : 'loading'}</div>
  );
};

describe('RiveWasmProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not initialize WASM without an animation consumer', () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    render(
      <RiveWasmProvider>
        <div>Home</div>
      </RiveWasmProvider>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(RuntimeLoader.awaitInstance).not.toHaveBeenCalled();
  });

  it('shares initialization across animations and provider remounts', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);
    let finishLoading!: () => void;
    jest.mocked(RuntimeLoader.awaitInstance).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishLoading = () =>
            resolve(
              {} as Awaited<ReturnType<typeof RuntimeLoader.awaitInstance>>,
            );
        }),
    );
    const view = (showAnimations: boolean) => (
      <StrictMode>
        <RiveWasmProvider>
          {showAnimations ? (
            <>
              <TestAnimation name="first" />
              <TestAnimation name="second" />
            </>
          ) : (
            <div>Home</div>
          )}
        </RiveWasmProvider>
      </StrictMode>
    );
    const { rerender, unmount } = render(view(false));
    expect(fetchSpy).not.toHaveBeenCalled();

    await act(async () => rerender(view(true)));
    expect(screen.getByTestId('first')).toHaveTextContent('loading');
    expect(screen.getByTestId('second')).toHaveTextContent('loading');
    expect(RuntimeLoader.awaitInstance).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2); // One WASM file and one shared animation file.

    await act(async () => finishLoading());
    expect(screen.getByTestId('first')).toHaveTextContent('ready');
    expect(screen.getByTestId('second')).toHaveTextContent('ready');

    unmount();
    await act(async () => {
      render(view(true));
    });
    expect(screen.getByTestId('first')).toHaveTextContent('ready');
    expect(RuntimeLoader.awaitInstance).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
