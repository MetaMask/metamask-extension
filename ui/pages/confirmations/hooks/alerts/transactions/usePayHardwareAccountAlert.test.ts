import {
  getMockConfirmStateForTransaction,
  getMockConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { isHardwareWallet } from '../../../../../selectors';
import { usePayHardwareAccountAlert } from './usePayHardwareAccountAlert';

jest.mock('../../../../../selectors', () => ({
  ...jest.requireActual('../../../../../selectors'),
  isHardwareWallet: jest.fn(),
}));

function runHookWithTransaction() {
  const transaction = genUnapprovedContractInteractionConfirmation();

  const state = getMockConfirmStateForTransaction(transaction);

  return renderHookWithConfirmContextProvider(
    () => usePayHardwareAccountAlert(),
    state,
  );
}

function runHookWithoutTransaction() {
  const state = getMockConfirmState();

  return renderHookWithConfirmContextProvider(
    () => usePayHardwareAccountAlert(),
    state,
  );
}

describe('usePayHardwareAccountAlert', () => {
  const isHardwareWalletMock = jest.mocked(isHardwareWallet);

  beforeEach(() => {
    jest.resetAllMocks();
    isHardwareWalletMock.mockReturnValue(false);
  });

  it('returns non-blocking warning alert for hardware wallet accounts', () => {
    isHardwareWalletMock.mockReturnValue(true);
    const { result } = runHookWithTransaction();

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.PayHardwareAccount,
        field: RowAlertKey.PayWith,
        reason: 'Gas sponsorship unavailable',
        message:
          "Gas sponsorship isn't available for hardware wallets. You'll pay the network fee.",
        severity: Severity.Warning,
        isBlocking: false,
      },
    ]);
  });

  it('returns no alert if from address is not a hardware wallet account', () => {
    isHardwareWalletMock.mockReturnValue(false);
    const { result } = runHookWithTransaction();

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alert if there is no current confirmation', () => {
    isHardwareWalletMock.mockReturnValue(true);
    const { result } = runHookWithoutTransaction();

    expect(result.current).toStrictEqual([]);
  });
});
