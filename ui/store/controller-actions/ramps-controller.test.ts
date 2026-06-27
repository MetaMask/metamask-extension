import * as BackgroundConnectionModule from '../background-connection';
import {
  getRampsQuotes,
  setRampsUserRegion,
} from './ramps-controller';

jest.mock('../background-connection');

describe('ramps-controller actions', () => {
  const mockSubmitRequestToBackground = jest.spyOn(
    BackgroundConnectionModule,
    'submitRequestToBackground',
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  it('calls submitRequestToBackground for setRampsUserRegion', async () => {
    await setRampsUserRegion('us-ca');

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'setRampsUserRegion',
      ['us-ca', undefined],
    );
  });

  it('calls submitRequestToBackground for getRampsQuotes', async () => {
    const quoteParams = {
      amount: 100,
      walletAddress: '0xabc',
      assetId: 'eip155:1/erc20:0x0',
    };

    await getRampsQuotes(quoteParams);

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'getRampsQuotes',
      [quoteParams],
    );
  });
});
