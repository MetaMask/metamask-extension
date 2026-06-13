import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useTransactionPayQuoteValidationError } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';
import { usePayQuoteValidationAlert } from './usePayQuoteValidationAlert';

jest.mock('../../pay/useTransactionPayData');

function runHook() {
  return renderHookWithConfirmContextProvider(
    () => usePayQuoteValidationAlert(),
    getMockConfirmState(),
  );
}

describe('usePayQuoteValidationAlert', () => {
  const useTransactionPayQuoteValidationErrorMock = jest.mocked(
    useTransactionPayQuoteValidationError,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    useTransactionPayQuoteValidationErrorMock.mockReturnValue(undefined);
  });

  it('returns no alerts if no quote validation error exists', () => {
    const { result } = runHook();

    expect(result.current).toStrictEqual([]);
  });

  it('returns a blocking general alert if a quote validation error exists', () => {
    useTransactionPayQuoteValidationErrorMock.mockReturnValue({
      chainId: '0x1',
      code: 'quote_simulation_failed',
      message: 'execution reverted',
      strategy: 'relay',
      tokenAddress: '0x123',
    } as never);

    const { result } = runHook();

    expect(result.current).toStrictEqual([
      {
        key: AlertsName.PayQuoteValidation,
        reason: 'Quote validation failed',
        message: 'Quote validation failed',
        severity: Severity.Danger,
        isBlocking: true,
      },
    ]);
  });
});
