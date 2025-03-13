import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import { Platform } from '../../../../types/global';
import { useTransactionModalContext } from '../../../contexts/transaction-modal';
import useConfirmationAlertActions from './useConfirmationAlertActions';

jest.mock('../../../contexts/transaction-modal', () => ({
  useTransactionModalContext: jest.fn(),
}));

const EXPECTED_BUY_URL =
  'https://portfolio.test/buy?metamaskEntry=ext_buy_sell_button&chainId=0x5&metricsEnabled=false';

function processAlertActionKey(actionKey: string) {
  const { result } = renderHookWithProvider(
    useConfirmationAlertActions,
    mockState,
  );

  result.current(actionKey);
}

describe('useConfirmationAlertActions', () => {
  const openModalMock = jest.fn();

  const useTransactionModalContextMock = jest.mocked(
    useTransactionModalContext,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionModalContextMock.mockReturnValue({
      openModal: openModalMock,
    });

    global.platform = { openTab: jest.fn() } as unknown as Platform;
  });

  it('opens portfolio tab if action key is Buy', () => {
    processAlertActionKey(AlertActionKey.Buy);

    expect(global.platform.openTab).toHaveBeenCalledTimes(1);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: EXPECTED_BUY_URL,
    });
  });

  it('opens advanced gas fee modal if action key is ShowAdvancedGasFeeModal', () => {
    processAlertActionKey(AlertActionKey.ShowAdvancedGasFeeModal);

    expect(openModalMock).toHaveBeenCalledTimes(1);
    expect(openModalMock).toHaveBeenCalledWith('advancedGasFee');
  });

  it('opens gas fee modal if action key is ShowGasFeeModal', () => {
    processAlertActionKey(AlertActionKey.ShowGasFeeModal);

    expect(openModalMock).toHaveBeenCalledTimes(1);
    expect(openModalMock).toHaveBeenCalledWith('editGasFee');
  });
});
