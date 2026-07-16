import { renderHook } from '@testing-library/react-hooks';
import { setSlippage } from '../../ducks/bridge/actions';
import {
  getBridgeQuotes,
  getFromToken,
  getIsSlippageUserOverride,
  getSlippage,
  getToToken,
} from '../../ducks/bridge/selectors';
import { useSmartSlippage } from './useSmartSlippage';

const mockDispatch = jest.fn();
const mockValues = new Map();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: unknown) => mockValues.get(selector),
}));

jest.mock('../../ducks/bridge/actions', () => ({
  setSlippage: jest.fn((payload) => ({ type: 'bridge/setSlippage', payload })),
}));

const fromToken = { assetId: 'eip155:1/slip44:60' };
const toToken = { assetId: 'eip155:1/erc20:0xabc' };
const activeQuote = {
  quote: {
    slippage: 1.5,
    srcAsset: fromToken,
    destAsset: toToken,
  },
};

describe('useSmartSlippage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValues.set(getFromToken, fromToken);
    mockValues.set(getToToken, toToken);
    mockValues.set(getSlippage, undefined);
    mockValues.set(getIsSlippageUserOverride, false);
    mockValues.set(getBridgeQuotes, { activeQuote, isLoading: false });
  });

  it('hydrates slippage from the current pair quote', () => {
    renderHook(() => useSmartSlippage());

    expect(setSlippage).toHaveBeenCalledWith(1.5);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('does not overwrite a user override', () => {
    mockValues.set(getIsSlippageUserOverride, true);

    renderHook(() => useSmartSlippage());

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
