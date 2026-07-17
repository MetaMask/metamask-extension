import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import { AlertActionKey } from '../../../components/app/confirm/info/row/constants';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { useGasFeeModalContext } from '../context/gas-fee-modal';
import { useConfirmContext } from '../context/confirm';
import { GasModalType } from '../constants/gas';
import useConfirmationAlertActions from './useConfirmationAlertActions';

jest.mock('../context/gas-fee-modal', () => ({
  useGasFeeModalContext: jest.fn(),
}));

jest.mock('../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../hooks/ramps/useRamps/useRamps');

const mockOpenBuyCryptoInPdapp = jest.fn();

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
  const useConfirmContextMock = jest.mocked(useConfirmContext);

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useRamps).mockReturnValue({
      openBuyCryptoInPdapp: mockOpenBuyCryptoInPdapp,
      getBuyURI: jest.fn(),
    } as ReturnType<typeof useRamps>);

    useGasFeeModalContextMock.mockReturnValue({
      openGasFeeModal: openGasFeeModalMock,
      closeGasFeeModal: jest.fn(),
      isGasFeeModalVisible: false,
      initialModalType: GasModalType.EstimatesModal,
    });

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        txParams: {
          type: TransactionEnvelopeType.feeMarket,
        },
      },
      isScrollToBottomCompleted: true,
      setIsScrollToBottomCompleted: jest.fn(),
      goBackTo: undefined,
    });
  });

  it('opens in-extension buy flow if action key is Buy', () => {
    processAlertActionKey(AlertActionKey.Buy);

    expect(mockOpenBuyCryptoInPdapp).toHaveBeenCalledTimes(1);
  });

  it('opens advanced EIP-1559 gas fee modal if action key is ShowAdvancedGasFeeModal for fee market transactions', () => {
    processAlertActionKey(AlertActionKey.ShowAdvancedGasFeeModal);

    expect(openGasFeeModalMock).toHaveBeenCalledTimes(1);
    expect(openGasFeeModalMock).toHaveBeenCalledWith(
      GasModalType.AdvancedEIP1559Modal,
    );
  });

  it('opens advanced gas price modal if action key is ShowAdvancedGasFeeModal for legacy transactions', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        txParams: {
          type: TransactionEnvelopeType.legacy,
        },
      },
      isScrollToBottomCompleted: true,
      setIsScrollToBottomCompleted: jest.fn(),
      goBackTo: undefined,
    });

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
