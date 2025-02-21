import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { useFourByte } from './useFourByte';

const DATA_MOCK = '0xd0e30db0';
const TO_MOCK = '0x1234567890123456789012345678901234567890';

describe('useFourByte', () => {
  it('returns the method name and params', () => {
    const { result } = renderHookWithProvider(
      () => useFourByte({ data: DATA_MOCK, to: TO_MOCK }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {
            [DATA_MOCK]: { name: 'Deposit', params: [] },
          },
        },
      },
    );

    expect(result.current.name).toEqual('Deposit');
    expect(result.current.params).toEqual([]);
  });

  it('returns null if resolution disabled', () => {
    const { result } = renderHookWithProvider(
      () => useFourByte({ data: DATA_MOCK, to: TO_MOCK }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: false,
          knownMethodData: {
            [DATA_MOCK]: { name: 'Deposit', params: [] },
          },
        },
      },
    );

    expect(result.current).toBeNull();
  });

  it('returns null if not known even if resolution enabled', () => {
    const { result } = renderHookWithProvider(
      () => useFourByte({ data: DATA_MOCK, to: TO_MOCK }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {},
        },
      },
    );

    expect(result.current).toBeNull();
  });

  it('returns null if no transaction to', () => {
    const { result } = renderHookWithProvider(
      () => useFourByte({ data: DATA_MOCK }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {
            [DATA_MOCK]: { name: 'Deposit', params: [] },
          },
        },
      },
    );

    expect(result.current).toBeNull();
  });
});
