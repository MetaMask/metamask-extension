import { DefaultRootState } from 'react-redux';

import mockState from '../../../../../test/data/mock-state.json';
import {
  EVM_NATIVE_ASSET,
  MOCK_NFT1155,
} from '../../../../../test/data/send/assets';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import * as SendContext from '../../context/send';
import { useBalance } from './useBalance';

function renderHook(state?: DefaultRootState) {
  const { result } = renderHookWithProvider(useBalance, state ?? mockState);
  return result.current;
}

describe('useBalance', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('return correct values for ERC1155 assets', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: MOCK_NFT1155,
      chainId: '0x5',
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    expect(result.balance).toEqual('5');
    expect(result.decimals).toEqual(0);
    expect(result.rawBalanceNumeric).toEqual(new Numeric('5', 10));
  });

  it('return return balance from asset if available', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: { ...EVM_NATIVE_ASSET, rawBalance: '0x346ba7725f412cbfdb' },
      chainId: '0x5',
    } as unknown as SendContext.SendContextType);
    const result = renderHook();
    expect(result.balance).toEqual('966.98798');
    expect(result.decimals).toEqual(18);
    expect(result.rawBalanceNumeric).toEqual(
      new Numeric('0x346ba7725f412cbfdb', 16).toBase(10),
    );
  });
});
