import type React from 'react';
import { waitFor } from '@testing-library/react';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import type { AssetData } from '../lib/types';

const mockRender = jest.fn((_element: React.ReactElement) => undefined);
const mockSendMessage = jest.fn(
  async (_message: Record<string, unknown>): Promise<unknown> => undefined,
);

jest.mock('react-dom/client', () => ({
  createRoot: () => ({ render: mockRender }),
}));

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: (path: string) => `chrome-extension://test/${path}`,
    sendMessage: (message: Record<string, unknown>) => mockSendMessage(message),
  },
}));

jest.mock('./widget', () => ({ Widget: () => null }));

const primary: AssetData = {
  ticker: 'ETH',
  name: 'Ethereum',
  iconUrl: null,
  color: null,
  caipAssetId: 'eip155:1/slip44:60',
  chainId: 'eip155:1',
  isNative: true,
  resultType: 'Verified',
  price: 2000,
  change24hPercent: 1,
  marketCap: 1,
  liquidity: null,
  volume24h: 1,
};

describe('widget frame', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    document.head.replaceChildren();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('loads ticker data and wires widget actions to background messages', async () => {
    window.history.replaceState({}, '', '?symbol=ETH&theme=dark');
    mockSendMessage.mockImplementation(async (message) => {
      if (message.type === EXTENSION_MESSAGES.GET_DATA) {
        return { body: { asset: primary, similar: [] } };
      }
      return undefined;
    });

    await import('./frame');
    document.querySelector('link')?.dispatchEvent(new Event('load'));

    await waitFor(() => expect(mockRender).toHaveBeenCalledTimes(1));
    expect(document.documentElement.dataset.theme).toBe('dark');

    const widget = mockRender.mock.calls[0][0];
    widget.props.onSwap(primary);
    widget.props.onViewDetails(primary);
    widget.props.onViewSimilar();
    widget.props.onSelectSimilar(primary);
    widget.props.onDisable();

    await waitFor(() =>
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED,
        body: { enabled: false },
      }),
    );
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGES.OPEN_EXTENSION,
      body: { page: 'swap', caipAssetId: primary.caipAssetId },
    });
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGES.OPEN_EXTENSION,
      body: { page: 'asset', caipAssetId: primary.caipAssetId },
    });
    expect(
      mockSendMessage.mock.calls.filter(
        ([message]) => message.type === EXTENSION_MESSAGES.TRACK_EVENT,
      ),
    ).toHaveLength(5);
  });

  it('does not load or render without a ticker symbol', async () => {
    window.history.replaceState({}, '', '?theme=light');

    await import('./frame');

    expect(document.querySelector('link')).toBeNull();
    expect(mockSendMessage).not.toHaveBeenCalled();
    expect(mockRender).not.toHaveBeenCalled();
  });
});
