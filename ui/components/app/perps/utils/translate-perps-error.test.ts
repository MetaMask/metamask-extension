import { PERPS_ERROR_CODES } from '@metamask/perps-controller';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import {
  ERROR_CODE_TO_I18N_KEY,
  API_ERROR_PATTERNS,
  CANCEL_ORDER_I18N_KEY_OVERRIDES,
  translatePerpsError,
  handlePerpsError,
} from './translate-perps-error';

jest.mock('@metamask/perps-controller', () => ({
  PERPS_ERROR_CODES: {
    CLIENT_NOT_INITIALIZED: 'CLIENT_NOT_INITIALIZED',
    CLIENT_REINITIALIZING: 'CLIENT_REINITIALIZING',
    PROVIDER_NOT_AVAILABLE: 'PROVIDER_NOT_AVAILABLE',
    TOKEN_NOT_SUPPORTED: 'TOKEN_NOT_SUPPORTED',
    BRIDGE_CONTRACT_NOT_FOUND: 'BRIDGE_CONTRACT_NOT_FOUND',
    WITHDRAW_FAILED: 'WITHDRAW_FAILED',
    POSITIONS_FAILED: 'POSITIONS_FAILED',
    ACCOUNT_STATE_FAILED: 'ACCOUNT_STATE_FAILED',
    MARKETS_FAILED: 'MARKETS_FAILED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    ORDER_LEVERAGE_REDUCTION_FAILED: 'ORDER_LEVERAGE_REDUCTION_FAILED',
    IOC_CANCEL: 'IOC_CANCEL',
    CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
    WITHDRAW_ASSET_ID_REQUIRED: 'WITHDRAW_ASSET_ID_REQUIRED',
    WITHDRAW_AMOUNT_REQUIRED: 'WITHDRAW_AMOUNT_REQUIRED',
    WITHDRAW_AMOUNT_POSITIVE: 'WITHDRAW_AMOUNT_POSITIVE',
    WITHDRAW_INVALID_DESTINATION: 'WITHDRAW_INVALID_DESTINATION',
    WITHDRAW_ASSET_NOT_SUPPORTED: 'WITHDRAW_ASSET_NOT_SUPPORTED',
    WITHDRAW_INSUFFICIENT_BALANCE: 'WITHDRAW_INSUFFICIENT_BALANCE',
    DEPOSIT_ASSET_ID_REQUIRED: 'DEPOSIT_ASSET_ID_REQUIRED',
    DEPOSIT_AMOUNT_REQUIRED: 'DEPOSIT_AMOUNT_REQUIRED',
    DEPOSIT_AMOUNT_POSITIVE: 'DEPOSIT_AMOUNT_POSITIVE',
    DEPOSIT_MINIMUM_AMOUNT: 'DEPOSIT_MINIMUM_AMOUNT',
    ORDER_COIN_REQUIRED: 'ORDER_COIN_REQUIRED',
    ORDER_LIMIT_PRICE_REQUIRED: 'ORDER_LIMIT_PRICE_REQUIRED',
    ORDER_PRICE_POSITIVE: 'ORDER_PRICE_POSITIVE',
    ORDER_UNKNOWN_COIN: 'ORDER_UNKNOWN_COIN',
    ORDER_SIZE_POSITIVE: 'ORDER_SIZE_POSITIVE',
    ORDER_PRICE_REQUIRED: 'ORDER_PRICE_REQUIRED',
    ORDER_SIZE_MIN: 'ORDER_SIZE_MIN',
    ORDER_LEVERAGE_INVALID: 'ORDER_LEVERAGE_INVALID',
    ORDER_LEVERAGE_BELOW_POSITION: 'ORDER_LEVERAGE_BELOW_POSITION',
    ORDER_MAX_VALUE_EXCEEDED: 'ORDER_MAX_VALUE_EXCEEDED',
    ORDER_TRIGGER_PRICE_REQUIRED: 'ORDER_TRIGGER_PRICE_REQUIRED',
    ORDER_TRIGGER_PRICE_POSITIVE: 'ORDER_TRIGGER_PRICE_POSITIVE',
    ORDER_TRIGGER_PRICE_NOT_SUPPORTED: 'ORDER_TRIGGER_PRICE_NOT_SUPPORTED',
    ORDER_TRIGGER_TPSL_UNSUPPORTED: 'ORDER_TRIGGER_TPSL_UNSUPPORTED',
    ORDER_TPSL_SIZE_INVALID: 'ORDER_TPSL_SIZE_INVALID',
    ORDER_TPSL_LINKAGE_CONFLICT: 'ORDER_TPSL_LINKAGE_CONFLICT',
    ORDER_TPSL_POSITION_LINKAGE_UNSUPPORTED:
      'ORDER_TPSL_POSITION_LINKAGE_UNSUPPORTED',
    ORDER_TPSL_LINKAGE_REQUIRED: 'ORDER_TPSL_LINKAGE_REQUIRED',
    ORDER_TIME_IN_FORCE_NOT_SUPPORTED: 'ORDER_TIME_IN_FORCE_NOT_SUPPORTED',
    ORDER_EDIT_TRIGGER_UNSUPPORTED: 'ORDER_EDIT_TRIGGER_UNSUPPORTED',
    ORDER_EDIT_ORDER_UNVERIFIABLE: 'ORDER_EDIT_ORDER_UNVERIFIABLE',
    ORDER_STRATEGY_PARAMS_NOT_SUPPORTED: 'ORDER_STRATEGY_PARAMS_NOT_SUPPORTED',
    ORDER_STRATEGY_FIELD_UNSUPPORTED: 'ORDER_STRATEGY_FIELD_UNSUPPORTED',
    ORDER_STRATEGY_MARKET_UNSUPPORTED: 'ORDER_STRATEGY_MARKET_UNSUPPORTED',
    ORDER_STRATEGY_HANDLE_UNKNOWN: 'ORDER_STRATEGY_HANDLE_UNKNOWN',
    ORDER_STRATEGY_CANCEL_INCOMPLETE: 'ORDER_STRATEGY_CANCEL_INCOMPLETE',
    ORDER_EDIT_STRATEGY_UNSUPPORTED: 'ORDER_EDIT_STRATEGY_UNSUPPORTED',
    ORDER_TWAP_DURATION_REQUIRED: 'ORDER_TWAP_DURATION_REQUIRED',
    ORDER_TWAP_DURATION_INVALID: 'ORDER_TWAP_DURATION_INVALID',
    ORDER_TWAP_NOTIONAL_TOO_SMALL: 'ORDER_TWAP_NOTIONAL_TOO_SMALL',
    ORDER_SCALE_RANGE_REQUIRED: 'ORDER_SCALE_RANGE_REQUIRED',
    ORDER_SCALE_RANGE_INVALID: 'ORDER_SCALE_RANGE_INVALID',
    ORDER_SCALE_COUNT_INVALID: 'ORDER_SCALE_COUNT_INVALID',
    ORDER_SCALE_SIZE_TOO_SMALL: 'ORDER_SCALE_SIZE_TOO_SMALL',
    ORDER_SCALE_NOTIONAL_TOO_SMALL: 'ORDER_SCALE_NOTIONAL_TOO_SMALL',
    ORDER_CHASE_INTERVAL_INVALID: 'ORDER_CHASE_INTERVAL_INVALID',
    ORDER_CHASE_DURATION_INVALID: 'ORDER_CHASE_DURATION_INVALID',
    ORDER_CHASE_LIMIT_REACHED: 'ORDER_CHASE_LIMIT_REACHED',
    ORDER_CHASE_ABANDONED: 'ORDER_CHASE_ABANDONED',
    ORDER_CHASE_TOUCH_UNAVAILABLE: 'ORDER_CHASE_TOUCH_UNAVAILABLE',
    EXCHANGE_ACCOUNT_NOT_FOUND: 'EXCHANGE_ACCOUNT_NOT_FOUND',
    EXCHANGE_MULTI_SIG_REQUIRED: 'EXCHANGE_MULTI_SIG_REQUIRED',
    EXCHANGE_INVALID_NONCE: 'EXCHANGE_INVALID_NONCE',
    EXCHANGE_CLIENT_NOT_AVAILABLE: 'EXCHANGE_CLIENT_NOT_AVAILABLE',
    INFO_CLIENT_NOT_AVAILABLE: 'INFO_CLIENT_NOT_AVAILABLE',
    SUBSCRIPTION_CLIENT_NOT_AVAILABLE: 'SUBSCRIPTION_CLIENT_NOT_AVAILABLE',
    NO_ACCOUNT_SELECTED: 'NO_ACCOUNT_SELECTED',
    KEYRING_LOCKED: 'KEYRING_LOCKED',
    INVALID_ADDRESS_FORMAT: 'INVALID_ADDRESS_FORMAT',
    TRANSFER_FAILED: 'TRANSFER_FAILED',
    SWAP_FAILED: 'SWAP_FAILED',
    SPOT_PAIR_NOT_FOUND: 'SPOT_PAIR_NOT_FOUND',
    PRICE_UNAVAILABLE: 'PRICE_UNAVAILABLE',
    UNSUPPORTED_COLLATERAL: 'UNSUPPORTED_COLLATERAL',
    BATCH_CANCEL_FAILED: 'BATCH_CANCEL_FAILED',
    BATCH_CLOSE_FAILED: 'BATCH_CLOSE_FAILED',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    REDUCE_ONLY_VIOLATION: 'REDUCE_ONLY_VIOLATION',
    POSITION_WOULD_FLIP: 'POSITION_WOULD_FLIP',
    MARGIN_ADJUSTMENT_FAILED: 'MARGIN_ADJUSTMENT_FAILED',
    TPSL_UPDATE_FAILED: 'TPSL_UPDATE_FAILED',
    ORDER_REJECTED: 'ORDER_REJECTED',
    SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    NETWORK_ERROR: 'NETWORK_ERROR',
  },
}));

const mockT = (key: string) => `[${key}]`;

describe('ERROR_CODE_TO_I18N_KEY', () => {
  it('maps every PERPS_ERROR_CODES value to an i18n key', () => {
    for (const code of Object.values(PERPS_ERROR_CODES)) {
      expect(ERROR_CODE_TO_I18N_KEY).toHaveProperty(code);
      expect(typeof ERROR_CODE_TO_I18N_KEY[code]).toBe('string');
    }
  });

  it('resolves every mapped i18n key to real en copy', () => {
    const keys = [...new Set(Object.values(ERROR_CODE_TO_I18N_KEY))];

    // `tEn` throws on a key the en locale does not define, so a mapping that
    // points at a string nobody ever added surfaces here rather than as an
    // empty error toast in front of a user.
    const emptyCopy = keys.filter((key) => tEn(key).trim().length === 0);

    expect(emptyCopy).toStrictEqual([]);
  });

  it('translates every v12 strategy placement error code', () => {
    // The controller added these in v12.0.0 for `twap` / `scale` / `chase`
    // placements. Named literally rather than filtered out of the enum so that
    // a code silently dropped from a future controller release fails here.
    const strategyCodes = [
      'ORDER_STRATEGY_PARAMS_NOT_SUPPORTED',
      'ORDER_STRATEGY_FIELD_UNSUPPORTED',
      'ORDER_STRATEGY_MARKET_UNSUPPORTED',
      'ORDER_STRATEGY_HANDLE_UNKNOWN',
      'ORDER_STRATEGY_CANCEL_INCOMPLETE',
      'ORDER_EDIT_STRATEGY_UNSUPPORTED',
      'ORDER_TWAP_DURATION_REQUIRED',
      'ORDER_TWAP_DURATION_INVALID',
      'ORDER_TWAP_NOTIONAL_TOO_SMALL',
      'ORDER_SCALE_RANGE_REQUIRED',
      'ORDER_SCALE_RANGE_INVALID',
      'ORDER_SCALE_COUNT_INVALID',
      'ORDER_SCALE_SIZE_TOO_SMALL',
      'ORDER_SCALE_NOTIONAL_TOO_SMALL',
      'ORDER_CHASE_INTERVAL_INVALID',
      'ORDER_CHASE_DURATION_INVALID',
      'ORDER_CHASE_LIMIT_REACHED',
      'ORDER_CHASE_ABANDONED',
      'ORDER_CHASE_TOUCH_UNAVAILABLE',
    ] as const;

    const translated = strategyCodes.map((code) => {
      const error = Object.assign(new Error('strategy rejected'), { code });
      return translatePerpsError(error, mockT);
    });

    expect(translated).toStrictEqual(
      strategyCodes.map(() => '[perpsOrderFailed]'),
    );
  });

  it('translates cancel-path strategy codes with the cancel wording', () => {
    const handleUnknown = Object.assign(new Error('no such handle'), {
      code: 'ORDER_STRATEGY_HANDLE_UNKNOWN',
    });
    const cancelIncomplete = Object.assign(new Error('partially resting'), {
      code: 'ORDER_STRATEGY_CANCEL_INCOMPLETE',
    });

    const results = [handleUnknown, cancelIncomplete].map((error) =>
      translatePerpsError(error, mockT, CANCEL_ORDER_I18N_KEY_OVERRIDES),
    );

    expect(results).toStrictEqual([
      '[perpsCancelOrderFailed]',
      '[perpsCancelOrderFailed]',
    ]);
  });

  it('maps WITHDRAW_FAILED to perpsWithdrawFailed', () => {
    expect(ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.WITHDRAW_FAILED]).toBe(
      'perpsWithdrawFailed',
    );
  });

  it('maps WITHDRAW_INSUFFICIENT_BALANCE to perpsWithdrawInsufficient', () => {
    expect(
      ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.WITHDRAW_INSUFFICIENT_BALANCE],
    ).toBe('perpsWithdrawInsufficient');
  });

  it('maps WITHDRAW_INVALID_DESTINATION to perpsWithdrawInvalidAddress', () => {
    expect(
      ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.WITHDRAW_INVALID_DESTINATION],
    ).toBe('perpsWithdrawInvalidAddress');
  });

  it('maps INVALID_ADDRESS_FORMAT to perpsWithdrawInvalidAddress', () => {
    expect(
      ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.INVALID_ADDRESS_FORMAT],
    ).toBe('perpsWithdrawInvalidAddress');
  });

  it('maps NO_ACCOUNT_SELECTED to perpsWithdrawNoAccount', () => {
    expect(ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.NO_ACCOUNT_SELECTED]).toBe(
      'perpsWithdrawNoAccount',
    );
  });

  it('maps ORDER_REJECTED to perpsOrderRejected', () => {
    expect(ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.ORDER_REJECTED]).toBe(
      'perpsOrderRejected',
    );
  });

  it('maps SLIPPAGE_EXCEEDED to perpsSlippageExceeded', () => {
    expect(ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.SLIPPAGE_EXCEEDED]).toBe(
      'perpsSlippageExceeded',
    );
  });

  it('maps RATE_LIMIT_EXCEEDED to perpsRateLimitExceeded', () => {
    expect(ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.RATE_LIMIT_EXCEEDED]).toBe(
      'perpsRateLimitExceeded',
    );
  });

  it('maps NETWORK_ERROR to perpsNetworkError', () => {
    expect(ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.NETWORK_ERROR]).toBe(
      'perpsNetworkError',
    );
  });

  it('maps BATCH_CANCEL_FAILED to perpsBatchCancelFailed', () => {
    expect(ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.BATCH_CANCEL_FAILED]).toBe(
      'perpsBatchCancelFailed',
    );
  });

  it('maps BATCH_CLOSE_FAILED to perpsBatchCloseFailed', () => {
    expect(ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.BATCH_CLOSE_FAILED]).toBe(
      'perpsBatchCloseFailed',
    );
  });

  it('maps INSUFFICIENT_MARGIN to perpsInsufficientMargin', () => {
    expect(ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.INSUFFICIENT_MARGIN]).toBe(
      'perpsInsufficientMargin',
    );
  });

  it('maps UNSUPPORTED_COLLATERAL to perpsUnsupportedCollateral', () => {
    expect(
      ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.UNSUPPORTED_COLLATERAL],
    ).toBe('perpsUnsupportedCollateral');
  });

  it('maps EXCHANGE_ACCOUNT_NOT_FOUND to perpsExchangeAccountNotFound', () => {
    expect(
      ERROR_CODE_TO_I18N_KEY[PERPS_ERROR_CODES.EXCHANGE_ACCOUNT_NOT_FOUND],
    ).toBe('perpsExchangeAccountNotFound');
  });
});

describe('API_ERROR_PATTERNS', () => {
  it('contains at least one pattern entry', () => {
    expect(API_ERROR_PATTERNS.length).toBeGreaterThan(0);
  });

  it('each entry has a RegExp pattern and a valid PerpsErrorCode', () => {
    for (const { pattern, code } of API_ERROR_PATTERNS) {
      expect(pattern).toBeInstanceOf(RegExp);
      expect(Object.values(PERPS_ERROR_CODES)).toContain(code);
    }
  });

  it('matches "insufficient margin" to INSUFFICIENT_MARGIN', () => {
    const match = API_ERROR_PATTERNS.find(({ pattern }) =>
      pattern.test('insufficient margin for this trade'),
    );
    expect(match?.code).toBe(PERPS_ERROR_CODES.INSUFFICIENT_MARGIN);
  });

  it('matches "order rejected" to ORDER_REJECTED', () => {
    const match = API_ERROR_PATTERNS.find(({ pattern }) =>
      pattern.test('Order rejected by exchange'),
    );
    expect(match?.code).toBe(PERPS_ERROR_CODES.ORDER_REJECTED);
  });

  it('matches "rate limit" to RATE_LIMIT_EXCEEDED', () => {
    const match = API_ERROR_PATTERNS.find(({ pattern }) =>
      pattern.test('rate limit exceeded'),
    );
    expect(match?.code).toBe(PERPS_ERROR_CODES.RATE_LIMIT_EXCEEDED);
  });

  it('matches "slippage" to SLIPPAGE_EXCEEDED', () => {
    const match = API_ERROR_PATTERNS.find(({ pattern }) =>
      pattern.test('slippage tolerance exceeded'),
    );
    expect(match?.code).toBe(PERPS_ERROR_CODES.SLIPPAGE_EXCEEDED);
  });

  it('matches "ioc cancel" to IOC_CANCEL', () => {
    const match = API_ERROR_PATTERNS.find(({ pattern }) =>
      pattern.test('ioc cancel'),
    );
    expect(match?.code).toBe(PERPS_ERROR_CODES.IOC_CANCEL);
  });

  it('matches case-insensitively', () => {
    const match = API_ERROR_PATTERNS.find(({ pattern }) =>
      pattern.test('INSUFFICIENT MARGIN'),
    );
    expect(match?.code).toBe(PERPS_ERROR_CODES.INSUFFICIENT_MARGIN);
  });
});

describe('translatePerpsError', () => {
  it('returns null for a plain non-Error value', () => {
    expect(translatePerpsError('some string', mockT)).toBeNull();
    expect(translatePerpsError(42, mockT)).toBeNull();
    expect(translatePerpsError(null, mockT)).toBeNull();
  });

  it('returns null for an Error with no code and no pattern match', () => {
    const error = new Error('completely unknown failure');
    expect(translatePerpsError(error, mockT)).toBeNull();
  });

  it('uses ERROR_CODE_TO_I18N_KEY when error has a known code', () => {
    const error = Object.assign(new Error('withdraw failed'), {
      code: PERPS_ERROR_CODES.WITHDRAW_FAILED,
    });
    expect(translatePerpsError(error, mockT)).toBe('[perpsWithdrawFailed]');
  });

  it('resolves an error code used as the message (e.g. WithdrawResult.error)', () => {
    const error = new Error('WITHDRAW_INSUFFICIENT_BALANCE');
    expect(translatePerpsError(error, mockT)).toBe(
      '[perpsWithdrawInsufficient]',
    );
  });

  it('resolves WITHDRAW_FAILED code string used as message', () => {
    const error = new Error('WITHDRAW_FAILED');
    expect(translatePerpsError(error, mockT)).toBe('[perpsWithdrawFailed]');
  });

  it('falls back to pattern matching when no code property is present', () => {
    const error = new Error('Order rejected by the exchange');
    expect(translatePerpsError(error, mockT)).toBe('[perpsOrderRejected]');
  });

  it('falls back to pattern matching when code is unknown', () => {
    const error = Object.assign(
      new Error('insufficient margin on this trade'),
      {
        code: 'TOTALLY_UNKNOWN_CODE',
      },
    );
    expect(translatePerpsError(error, mockT)).toBe('[perpsInsufficientMargin]');
  });

  it('returns the translated string for RATE_LIMIT_EXCEEDED code', () => {
    const error = Object.assign(new Error('too many requests'), {
      code: PERPS_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    });
    expect(translatePerpsError(error, mockT)).toBe('[perpsRateLimitExceeded]');
  });

  it('returns the translated string for SLIPPAGE_EXCEEDED code', () => {
    const error = Object.assign(new Error('slippage exceeded'), {
      code: PERPS_ERROR_CODES.SLIPPAGE_EXCEEDED,
    });
    expect(translatePerpsError(error, mockT)).toBe('[perpsSlippageExceeded]');
  });

  it('returns translated string for BATCH_CANCEL_FAILED', () => {
    const error = Object.assign(new Error('batch cancel failed'), {
      code: PERPS_ERROR_CODES.BATCH_CANCEL_FAILED,
    });
    expect(translatePerpsError(error, mockT)).toBe('[perpsBatchCancelFailed]');
  });

  describe('with CANCEL_ORDER_I18N_KEY_OVERRIDES', () => {
    it('remaps placement copy to cancel copy for a code lookup', () => {
      const error = Object.assign(new Error('unknown coin'), {
        code: PERPS_ERROR_CODES.ORDER_UNKNOWN_COIN,
      });
      expect(translatePerpsError(error, mockT)).toBe('[perpsOrderFailed]');
      expect(
        translatePerpsError(error, mockT, CANCEL_ORDER_I18N_KEY_OVERRIDES),
      ).toBe('[perpsCancelOrderFailed]');
    });

    it('remaps for a message-as-code lookup', () => {
      const error = new Error('ORDER_UNKNOWN_COIN');
      expect(
        translatePerpsError(error, mockT, CANCEL_ORDER_I18N_KEY_OVERRIDES),
      ).toBe('[perpsCancelOrderFailed]');
    });

    it('remaps for a pattern match', () => {
      const error = new Error('cancel 0: asset not found');
      expect(
        translatePerpsError(error, mockT, CANCEL_ORDER_I18N_KEY_OVERRIDES),
      ).toBe('[perpsCancelOrderFailed]');
    });

    it('leaves keys outside the override map alone', () => {
      const error = new Error('network error');
      expect(
        translatePerpsError(error, mockT, CANCEL_ORDER_I18N_KEY_OVERRIDES),
      ).toBe('[perpsNetworkError]');
    });
  });
});

describe('handlePerpsError', () => {
  it('returns translated message when error has a known code', () => {
    const error = Object.assign(new Error('withdraw'), {
      code: PERPS_ERROR_CODES.WITHDRAW_FAILED,
    });
    expect(handlePerpsError(error, mockT)).toBe('[perpsWithdrawFailed]');
  });

  it('falls back to somethingWentWrong for unknown errors', () => {
    expect(handlePerpsError(new Error('totally unknown'), mockT)).toBe(
      '[somethingWentWrong]',
    );
  });

  it('falls back to somethingWentWrong for non-Error values', () => {
    expect(handlePerpsError(null, mockT)).toBe('[somethingWentWrong]');
    expect(handlePerpsError(undefined, mockT)).toBe('[somethingWentWrong]');
    expect(handlePerpsError('raw string error', mockT)).toBe(
      '[somethingWentWrong]',
    );
  });

  it('returns translated message when pattern match succeeds', () => {
    const error = new Error('connection timed out waiting for server');
    expect(handlePerpsError(error, mockT)).toBe('[perpsConnectionTimeout]');
  });
});
