import { Hex } from '@metamask/utils';
import {
  TransactionPayRequiredToken,
  TransactionPaymentToken,
} from '@metamask/transaction-pay-controller';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useTransactionPayToken } from '../../pay/useTransactionPayToken';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useNoRequiredTokenAlert } from './useNoRequiredTokenAlert';

jest.mock('../../pay/useTransactionPayToken');
jest.mock('../../pay/useTransactionPayData');

const ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
const CHAIN_ID_MOCK = '0x1' as Hex;

const PAY_TOKEN_MOCK = {
  address: ADDRESS_MOCK,
  chainId: CHAIN_ID_MOCK,
} as TransactionPaymentToken;

const REQUIRED_TOKEN_MOCK = {
  address: ADDRESS_MOCK,
  skipIfBalance: false,
} as TransactionPayRequiredToken;

function runHook() {
  const state = getMockConfirmState();

  return renderHookWithConfirmContextProvider(
    () => useNoRequiredTokenAlert(),
    state,
  );
}

describe('useNoRequiredTokenAlert', () => {
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayPrimaryRequiredTokenMock = jest.mocked(
    useTransactionPayPrimaryRequiredToken,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      isNative: false,
      setPayToken: jest.fn(),
    });

    useTransactionPayPrimaryRequiredTokenMock.mockReturnValue(undefined);
  });

  it('returns alert if pay token selected but no primary required token', () => {
    const { result } = runHook();

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.NoRequiredToken,
        field: RowAlertKey.PayWith,
        message: 'Unknown target token',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });

  it('returns no alerts if no pay token selected', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      isNative: false,
      setPayToken: jest.fn(),
    });

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns no alerts if primary required token is present', () => {
    useTransactionPayPrimaryRequiredTokenMock.mockReturnValue(
      REQUIRED_TOKEN_MOCK,
    );

    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });
});
