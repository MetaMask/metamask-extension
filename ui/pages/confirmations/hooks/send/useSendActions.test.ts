import { TransactionMeta } from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import { EVM_ASSET, SOLANA_ASSET } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import * as SendUtils from '../../utils/send';
import * as MultichainTransactionUtils from '../../utils/multichain-snaps';
import * as SendContext from '../../context/send';
import { useSendActions } from './useSendActions';

const MOCK_ADDRESS_1 = '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73';
const MOCK_ADDRESS_2 = '0xd12662965960f3855a09f85396459429a595d741';
const MOCK_ADDRESS_3 = '4Nd1m5PztHZbA1FtdYzWxTjLdQdHZr4sqoZKxK3x3hJv';
const MOCK_ADDRESS_4 = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';

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
  useDispatch: () => (fn: () => void) => {
    if (fn) {
      fn();
    }
  },
}));

function renderHook() {
  const { result } = renderHookWithProvider(useSendActions, mockState);
  return result.current;
}

describe('useSendQueryParams', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('result returns method handleCancel to cancel send', () => {
    const result = renderHook();
    result.handleCancel();
    expect(mockHistory.push).toHaveBeenCalledWith('/');
  });

  it('result returns method handleBack to goto previous page', () => {
    const result = renderHook();
    result.handleBack();
    expect(mockHistory.goBack).toHaveBeenCalled();
  });

  it('handleSubmit is able to submit evm send', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      to: MOCK_ADDRESS_2,
      value: 10,
      maxValueMode: true,
    } as unknown as SendContext.SendContextType);

    const mockSubmitEvmTransaction = jest
      .spyOn(SendUtils, 'submitEvmTransaction')
      .mockImplementation(() =>
        Promise.resolve(() =>
          Promise.resolve({} as unknown as TransactionMeta),
        ),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_2);

    expect(mockSubmitEvmTransaction).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockHistory.push).toHaveBeenCalledWith(
        '/confirm-transaction?maxValueMode=true',
      );
    });
  });

  it('handleSubmit is able to submit non-evm send', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      from: MOCK_ADDRESS_3,
      to: MOCK_ADDRESS_4,
      value: 10,
    } as unknown as SendContext.SendContextType);

    const mockSubmitNonEvmTransaction = jest
      .spyOn(MultichainTransactionUtils, 'sendMultichainTransactionForReview')
      .mockImplementation(() => Promise.resolve());

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_4);

    expect(mockSubmitNonEvmTransaction).toHaveBeenCalled();
  });
});
