import { useQuery } from '@tanstack/react-query';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { selectAddressPoisoningKnownRecipients } from '../../selectors/address-poisoning-known-recipients';
import {
  getFromAddress,
  useAddressPoisoningActivity,
} from './useAddressPoisoningActivity';

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(),
  };
});

jest.mock('../../selectors/address-poisoning-known-recipients', () => ({
  selectAddressPoisoningKnownRecipients: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockSelectKnownRecipients = jest.mocked(
  selectAddressPoisoningKnownRecipients,
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

describe('getFromAddress', () => {
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
    mockSelectKnownRecipients.mockReturnValue({
      recipients: ['0x111122223333444455556666777788889999aaaa'],
      fingerprint: 'fp',
    });
    mockUseQuery.mockReturnValue({
      data: [],
      isPending: false,
      isFetching: false,
    } as ReturnType<typeof useQuery>);
  });

  it('is true when lookalike matches exist', () => {
    mockUseQuery.mockReturnValue({
      data: [{ knownAddress: '0x111122223333444455556666777788889999aaaa' }],
      isPending: false,
      isFetching: false,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHookWithProvider(() =>
      useAddressPoisoningActivity(receiveActivity),
    );

    expect(result.current).toBe(true);
  });

  it('is false while the query is pending', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHookWithProvider(() =>
      useAddressPoisoningActivity(receiveActivity),
    );

    expect(result.current).toBe(false);
  });

  it('is false when there is no lookalike match', () => {
    const { result } = renderHookWithProvider(() =>
      useAddressPoisoningActivity(receiveActivity),
    );

    expect(result.current).toBe(false);
  });
});
