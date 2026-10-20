import { submitRequestToBackground } from '../background-connection';
import { fetchQuotes } from './bridge-controller';

jest.mock('../background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

describe('fetchQuotes', () => {
  it('fetches bridge quotes through the bridge controller messenger action', async () => {
    const quoteRequest = { requestId: 'quote-id' };
    const quoteResponse = [{ requestId: 'quote-id' }];
    mockSubmitRequestToBackground.mockResolvedValue(quoteResponse);

    // @ts-expect-error This test only needs a small request fixture to verify forwarding.
    const result = await fetchQuotes(quoteRequest);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'BridgeController:fetchQuotes',
      [quoteRequest],
    );
    expect(result).toBe(quoteResponse);
  });
});
