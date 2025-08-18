import { TransactionMeta } from '@metamask/transaction-controller';

import mockState from '../../../../../test/data/mock-state.json';
import { EVM_ASSET } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import * as SendUtils from '../../utils/send';
import * as SendContext from '../../context/send';
import { useSendActions } from './useSendActions';

const MOCK_ADDRESS_1 = '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73';
const MOCK_ADDRESS_2 = '0xd12662965960f3855a09f85396459429a595d741';

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
  useDispatch: async (fn: () => Promise<unknown>) => await fn(),
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

  it('result returns method handleSubmit to submit transaction', () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      from: MOCK_ADDRESS_1,
      to: MOCK_ADDRESS_2,
      value: 10,
    } as unknown as SendContext.SendContextType);

    const mockSubmitEvmTransaction = jest
      .spyOn(SendUtils, 'submitEvmTransaction')
      .mockImplementation(() =>
        Promise.resolve(() =>
          Promise.resolve({} as unknown as TransactionMeta),
        ),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_1);

    expect(mockSubmitEvmTransaction).toHaveBeenCalled();
  });
});
