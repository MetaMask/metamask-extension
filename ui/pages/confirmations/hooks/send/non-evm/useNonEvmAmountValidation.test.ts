import mockState from '../../../../../../test/data/mock-state.json';
import { SOLANA_ASSET } from '../../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import * as SendContext from '../../../context/send';
// eslint-disable-next-line import/no-namespace
import * as MultichainSnapsUtils from '../../../utils/multichain-snaps';
import { useNonEvmAmountValidation } from './useNonEvmAmountValidation';

export const ACCOUNT_ADDRESS_MOCK =
  '14grJpemFaf88c8tiVb77W7TYg2W3ir6pfkKz3YjhhZ5';

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

function renderHook() {
  const { result } = renderHookWithProvider(
    useNonEvmAmountValidation,
    mockState,
  );
  return result.current;
}

describe('useNonEvmAmountValidation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not return error if amount of asset is less than balance', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      fromAccount: { id: 'some_id' },
      value: 2,
    } as unknown as SendContext.SendContextType);
    jest
      .spyOn(MultichainSnapsUtils, 'validateAmountMultichain')
      .mockImplementation(() => Promise.resolve({ valid: true }));

    const result = renderHook();
    const error = await result.validateNonEvmAmount();
    expect(error).toBeUndefined();
  });

  it('does not return error for undefined amount value', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      fromAccount: { id: 'some_id' },
    } as unknown as SendContext.SendContextType);

    const result = renderHook();
    const error = await result.validateNonEvmAmount();
    expect(error).toBeUndefined();
  });

  it('return error for invalid amount value', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      fromAccount: { id: 'some_id' },
      value: 'abc',
    } as unknown as SendContext.SendContextType);

    const result = renderHook();
    const error = await result.validateNonEvmAmount();
    expect(error).toEqual('Invalid value');
  });

  it('return error if amount of asset is more than balance', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      fromAccount: { id: 'some_id' },
      value: 10,
    } as unknown as SendContext.SendContextType);
    jest
      .spyOn(MultichainSnapsUtils, 'validateAmountMultichain')
      .mockImplementation(() =>
        Promise.resolve({
          valid: false,
          errors: [{ code: 'InsufficientBalance' }],
        }),
      );

    const result = renderHook();
    const error = await result.validateNonEvmAmount();
    expect(error).toEqual('Insufficient funds');
  });
});
