import { useAddressPoisoningDetection } from '../confirmations/hooks/send/useAddressPoisoningDetection';
import {
  getFromAddress,
  useAddressPoisoningActivity,
} from './useAddressPoisoningActivity';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';

jest.mock('../confirmations/hooks/send/useAddressPoisoningDetection', () => ({
  useAddressPoisoningDetection: jest.fn(),
}));

const mockUseAddressPoisoningDetection = jest.mocked(
  useAddressPoisoningDetection,
);

const receiveActivity = {
  type: 'receive',
  chainId: 'eip155:1',
  status: 'success',
  timestamp: 1,
  hash: '0xabc',
  data: {
    from: '0x1111ffffffffffffffffffffffffffffffffaaaa',
    to: '0x2222222222222222222222222222222222222222',
  },
} as Parameters<typeof useAddressPoisoningActivity>[0];

describe('getReceiveFromAddressForPoisoningCheck', () => {
  it('returns from on a confirmed receive', () => {
    expect(getFromAddress(receiveActivity)).toBe(receiveActivity.data.from);
  });

  it('returns undefined for pending receive', () => {
    expect(
      getFromAddress({
        ...receiveActivity,
        status: 'pending',
      }),
    ).toBeUndefined();
  });

  it('returns undefined for send', () => {
    expect(
      getFromAddress({
        ...receiveActivity,
        type: 'send',
      }),
    ).toBeUndefined();
  });
});

describe('useAddressPoisoningActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is true when phishing controller reports a lookalike match', () => {
    mockUseAddressPoisoningDetection.mockReturnValue({
      isPoisoningSuspect: true,
      bestMatch: null,
      matches: [],
      pending: false,
    });

    const { result } = renderHookWithProvider(() =>
      useAddressPoisoningActivity(receiveActivity),
    );

    expect(mockUseAddressPoisoningDetection).toHaveBeenCalledWith(
      receiveActivity.data.from,
    );
    expect(result.current).toBe(true);
  });

  it('is false while the poisoning check is pending', () => {
    mockUseAddressPoisoningDetection.mockReturnValue({
      isPoisoningSuspect: false,
      bestMatch: null,
      matches: [],
      pending: true,
    });

    const { result } = renderHookWithProvider(() =>
      useAddressPoisoningActivity(receiveActivity),
    );

    expect(result.current).toBe(false);
  });

  it('is false when there is no lookalike match', () => {
    mockUseAddressPoisoningDetection.mockReturnValue({
      isPoisoningSuspect: false,
      bestMatch: null,
      matches: [],
      pending: false,
    });

    const { result } = renderHookWithProvider(() =>
      useAddressPoisoningActivity(receiveActivity),
    );

    expect(result.current).toBe(false);
  });
});
