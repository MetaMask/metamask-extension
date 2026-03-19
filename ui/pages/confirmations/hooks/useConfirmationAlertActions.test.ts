import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import { useGasFeeModalContext } from '../context/gas-fee-modal';
import { GasModalType } from '../constants/gas';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';
import useConfirmationAlertActions from './useConfirmationAlertActions';

jest.mock('../context/gas-fee-modal', () => ({
  useGasFeeModalContext: jest.fn(),
}));

jest.mock('./useTransactionMetadataRequest', () => ({
  useTransactionMetadataRequest: jest.fn(),
}));

const EXPECTED_BUY_URL =
  'https://portfolio.test/buy?metamaskEntry=ext_buy_sell_button&chainId=5&metricsEnabled=false';

function processAlertActionKey(actionKey: string) {
  const { result } = renderHookWithProvider(
    useConfirmationAlertActions,
    mockState,
  );

  result.current(actionKey);
}

describe('useConfirmationAlertActions', () => {
  const openGasFeeModalMock = jest.fn();

  const useGasFeeModalContextMock = jest.mocked(useGasFeeModalContext);
  const useTransactionMetadataRequestMock = jest.mocked(
    useTransactionMetadataRequest,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useGasFeeModalContextMock.mockReturnValue({
      openGasFeeModal: openGasFeeModalMock,
      closeGasFeeModal: jest.fn(),
      isGasFeeModalVisible: false,
      initialModalType: GasModalType.EstimatesModal,
    });

    useTransactionMetadataRequestMock.mockReturnValue({
      txParams: {
        type: TransactionEnvelopeType.feeMarket,
      },
    } as ReturnType<typeof useTransactionMetadataRequest>);

    // @ts-expect-error mocking platform
    global.platform = { openTab: jest.fn() };
  });

  it('opens portfolio tab if action key is Buy', () => {
    processAlertActionKey(AlertActionKey.Buy);

    expect(global.platform.openTab).toHaveBeenCalledTimes(1);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: EXPECTED_BUY_URL,
    });
  });

  it('opens advanced EIP-1559 gas fee modal if action key is ShowAdvancedGasFeeModal for fee market transactions', () => {
    processAlertActionKey(AlertActionKey.ShowAdvancedGasFeeModal);

    expect(openGasFeeModalMock).toHaveBeenCalledTimes(1);
    expect(openGasFeeModalMock).toHaveBeenCalledWith(
      GasModalType.AdvancedEIP1559Modal,
    );
  });

  it('opens advanced gas price modal if action key is ShowAdvancedGasFeeModal for legacy transactions', () => {
    useTransactionMetadataRequestMock.mockReturnValue({
      txParams: {
        type: TransactionEnvelopeType.legacy,
      },
    } as ReturnType<typeof useTransactionMetadataRequest>);

    processAlertActionKey(AlertActionKey.ShowAdvancedGasFeeModal);

    expect(openGasFeeModalMock).toHaveBeenCalledTimes(1);
    expect(openGasFeeModalMock).toHaveBeenCalledWith(
      GasModalType.AdvancedGasPriceModal,
    );
  });

  it('opens estimates modal if action key is ShowGasFeeModal', () => {
    processAlertActionKey(AlertActionKey.ShowGasFeeModal);

    expect(openGasFeeModalMock).toHaveBeenCalledTimes(1);
    expect(openGasFeeModalMock).toHaveBeenCalledWith(
      GasModalType.EstimatesModal,
    );
  });
});
