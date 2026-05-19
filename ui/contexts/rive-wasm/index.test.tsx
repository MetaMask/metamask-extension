export {};

describe('rive-wasm context', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('does not fetch wasm until preload is requested, then only loads once', async () => {
    const awaitInstance = jest.fn().mockResolvedValue(undefined);
    const setWasmUrl = jest.fn();

    jest.doMock('@rive-app/react-canvas', () => ({
      RuntimeLoader: {
        awaitInstance,
        setWasmUrl,
      },
    }));

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    global.fetch = fetchMock as typeof fetch;

    const riveWasmModule = await import(".");

    expect(fetchMock).not.toHaveBeenCalled();

    await riveWasmModule.preloadRiveWasm();
    await riveWasmModule.preloadRiveWasm();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(setWasmUrl).toHaveBeenCalledWith('should not fetch wasm');
    expect(awaitInstance).toHaveBeenCalledTimes(1);
  });
});
