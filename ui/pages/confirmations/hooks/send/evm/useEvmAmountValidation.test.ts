import { DefaultRootState } from 'react-redux';

import mockState from '../../../../../../test/data/mock-state.json';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
} from '../../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import * as SendContext from '../../../context/send';
import { useEvmAmountValidation } from './useEvmAmountValidation';

const MOCK_ADDRESS_1 = '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73';

const mockHistory = {
  goBack: jest.fn(),
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => async (fn: () => Promise<unknown>) => {
    if (fn) {
      await fn();
    }
  },
}));

function renderHook(args: DefaultRootState = {}) {
  const { result } = renderHookWithProvider(useEvmAmountValidation, {
    ...mockState,
    metamask: { ...mockState.metamask, ...args },
  });
  return result.current;
}

describe('useEvmAmountValidation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not return error if amount of native asset is less than balance', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
      value: 2,
    } as unknown as SendContext.SendContextType);

    const result = renderHook({
      accountsByChainId: { '0x1': { [MOCK_ADDRESS_1]: { balance: '0x5' } } },
    });
    const error = result.validateEvmAmount();
    expect(error).toBeUndefined();
  });

  it('does not return error for undefined amount value', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      from: MOCK_ADDRESS_1,
    } as unknown as SendContext.SendContextType);

    const result = renderHook({
      accountsByChainId: { '0x1': { [MOCK_ADDRESS_1]: { balance: '0x5' } } },
    });
    const error = result.validateEvmAmount();
    expect(error).toBeUndefined();
  });

  it('return error if amount of native asset is more than balance', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_NATIVE_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      value: 10,
    } as unknown as SendContext.SendContextType);

    const result = renderHook({
      accountsByChainId: { '0x5': { [MOCK_ADDRESS_1]: { balance: '0x5' } } },
    });
    const error = result.validateEvmAmount();
    expect(error).toEqual('Insufficient funds');
  });

  it('does not return error if amount of ERC20 asset is less than balance', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      from: MOCK_ADDRESS_1,
      value: 2,
    } as unknown as SendContext.SendContextType);

    const result = renderHook({
      tokenBalances: {
        [MOCK_ADDRESS_1]: {
          '0x5': {
            [EVM_ASSET.address]: 0x738,
          },
        },
      },
    });
    const error = result.validateEvmAmount();
    expect(error).toBeUndefined();
  });

  it('return error if amount of ERC20 asset is more than balance', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      from: MOCK_ADDRESS_1,
      value: 2000,
    } as unknown as SendContext.SendContextType);

    const result = renderHook({
      tokenBalances: {
        [MOCK_ADDRESS_1]: {
          '0x5': {
            [EVM_ASSET.address]: '0x738',
          },
        },
      },
    });
    const error = result.validateEvmAmount();
    expect(error).toEqual('Insufficient funds');
  });
});
