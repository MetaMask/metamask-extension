/* eslint-disable @typescript-eslint/naming-convention */
import { isPayRpcTypeAllowed } from './pay-rpc';

const PERPS_TERMINAL = 'https://perps-terminal.metamask.com';
const BOTH_TYPES = ['perpsDeposit', 'perpsWithdraw'];

const WITHDRAW_ENABLED = { default: { enabled: true } };

function buildSource({
  payRpc,
  postQuote = WITHDRAW_ENABLED,
}: {
  payRpc?: unknown;
  postQuote?: unknown;
}) {
  return {
    remoteFeatureFlags: {
      confirmations_pay_rpc: payRpc,
      confirmations_pay_post_quote: postQuote,
    },
  };
}

function buildPayRpc(
  dapps: Record<string, { allowedTypes: unknown }>,
  allowedTypes: unknown = BOTH_TYPES,
) {
  return { allowedTypes, dapps };
}

describe('isPayRpcTypeAllowed', () => {
  describe('allowlist', () => {
    it('allows a listed dApp to request an enabled type', () => {
      const source = buildSource({
        payRpc: buildPayRpc({ [PERPS_TERMINAL]: { allowedTypes: BOTH_TYPES } }),
      });

      expect(isPayRpcTypeAllowed(source, PERPS_TERMINAL, 'perpsDeposit')).toBe(
        true,
      );
    });

    it('rejects a dApp that is not listed', () => {
      const source = buildSource({
        payRpc: buildPayRpc({ [PERPS_TERMINAL]: { allowedTypes: BOTH_TYPES } }),
      });

      expect(
        isPayRpcTypeAllowed(source, 'https://other.example', 'perpsDeposit'),
      ).toBe(false);
    });

    it('rejects a type the dApp is not listed for', () => {
      const source = buildSource({
        payRpc: buildPayRpc({
          [PERPS_TERMINAL]: { allowedTypes: ['perpsDeposit'] },
        }),
      });

      expect(isPayRpcTypeAllowed(source, PERPS_TERMINAL, 'perpsWithdraw')).toBe(
        false,
      );
    });

    it('rejects a type missing from the top-level allowedTypes', () => {
      const source = buildSource({
        payRpc: buildPayRpc(
          { [PERPS_TERMINAL]: { allowedTypes: BOTH_TYPES } },
          ['perpsWithdraw'],
        ),
      });

      expect(isPayRpcTypeAllowed(source, PERPS_TERMINAL, 'perpsDeposit')).toBe(
        false,
      );
    });

    it('rejects everything when the top-level allowedTypes is empty', () => {
      const source = buildSource({
        payRpc: buildPayRpc(
          { [PERPS_TERMINAL]: { allowedTypes: BOTH_TYPES } },
          [],
        ),
      });

      expect(isPayRpcTypeAllowed(source, PERPS_TERMINAL, 'perpsDeposit')).toBe(
        false,
      );
      expect(isPayRpcTypeAllowed(source, PERPS_TERMINAL, 'perpsWithdraw')).toBe(
        false,
      );
    });

    it('rejects an unknown type even if listed', () => {
      const source = buildSource({
        payRpc: buildPayRpc(
          { [PERPS_TERMINAL]: { allowedTypes: ['somethingElse'] } },
          ['somethingElse'],
        ),
      });

      expect(isPayRpcTypeAllowed(source, PERPS_TERMINAL, 'perpsDeposit')).toBe(
        false,
      );
    });
  });

  describe('origin matching', () => {
    const source = buildSource({
      payRpc: buildPayRpc({
        [PERPS_TERMINAL]: { allowedTypes: BOTH_TYPES },
        'http://localhost': { allowedTypes: BOTH_TYPES },
      }),
    });

    it('does not match a different scheme', () => {
      expect(
        isPayRpcTypeAllowed(
          source,
          'http://perps-terminal.metamask.com',
          'perpsDeposit',
        ),
      ).toBe(false);
    });

    it('does not match a different port on a non-localhost origin', () => {
      expect(
        isPayRpcTypeAllowed(
          source,
          'https://perps-terminal.metamask.com:8443',
          'perpsDeposit',
        ),
      ).toBe(false);
    });

    it('ignores a path or trailing slash on the request origin', () => {
      expect(
        isPayRpcTypeAllowed(source, `${PERPS_TERMINAL}/`, 'perpsDeposit'),
      ).toBe(true);
      expect(
        isPayRpcTypeAllowed(source, `${PERPS_TERMINAL}/trade`, 'perpsDeposit'),
      ).toBe(true);
    });

    for (const origin of [
      'http://localhost',
      'http://localhost:3000',
      'http://localhost:8080',
    ]) {
      it(`matches ${origin} against the http://localhost entry`, () => {
        expect(isPayRpcTypeAllowed(source, origin, 'perpsDeposit')).toBe(true);
      });
    }

    it('does not match https://localhost against the http://localhost entry', () => {
      expect(
        isPayRpcTypeAllowed(source, 'https://localhost:3000', 'perpsDeposit'),
      ).toBe(false);
    });

    it('rejects an origin that is not a valid URL', () => {
      expect(isPayRpcTypeAllowed(source, 'not a url', 'perpsDeposit')).toBe(
        false,
      );
    });
  });

  describe('invalid flag', () => {
    const invalidFlags: [string, unknown][] = [
      ['missing', undefined],
      ['null', null],
      ['an array', []],
      ['a string', 'enabled'],
    ];

    for (const [label, payRpc] of invalidFlags) {
      it(`rejects everything when the flag is ${label}`, () => {
        expect(
          isPayRpcTypeAllowed(
            buildSource({ payRpc }),
            PERPS_TERMINAL,
            'perpsDeposit',
          ),
        ).toBe(false);
      });
    }

    it('rejects everything when remote flags are missing', () => {
      expect(isPayRpcTypeAllowed({}, PERPS_TERMINAL, 'perpsDeposit')).toBe(
        false,
      );
    });

    it('treats a non-array allowedTypes as empty', () => {
      const source = buildSource({
        payRpc: buildPayRpc(
          { [PERPS_TERMINAL]: { allowedTypes: 'perpsDeposit' } },
          'perpsDeposit',
        ),
      });

      expect(isPayRpcTypeAllowed(source, PERPS_TERMINAL, 'perpsDeposit')).toBe(
        false,
      );
    });

    it('rejects everything when dapps is not an object', () => {
      const source = buildSource({
        payRpc: { allowedTypes: BOTH_TYPES, dapps: [PERPS_TERMINAL] },
      });

      expect(isPayRpcTypeAllowed(source, PERPS_TERMINAL, 'perpsDeposit')).toBe(
        false,
      );
    });
  });

  describe('perpsWithdraw', () => {
    const payRpc = buildPayRpc({
      [PERPS_TERMINAL]: { allowedTypes: BOTH_TYPES },
    });

    const enabledFlags: [string, unknown][] = [
      ['default', { default: { enabled: true } }],
      ['overrides', { overrides: { perpsWithdraw: { enabled: true } } }],
      ['a direct key', { perpsWithdraw: { enabled: true } }],
    ];

    for (const [label, postQuote] of enabledFlags) {
      it(`is allowed when the in-wallet withdraw flag is enabled via ${label}`, () => {
        expect(
          isPayRpcTypeAllowed(
            buildSource({ payRpc, postQuote }),
            PERPS_TERMINAL,
            'perpsWithdraw',
          ),
        ).toBe(true);
      });
    }

    const disabledFlags: [string, unknown][] = [
      ['missing', null],
      ['disabled by default', { default: { enabled: false } }],
      [
        'disabled for perpsWithdraw',
        {
          default: { enabled: true },
          overrides: { perpsWithdraw: { enabled: false } },
        },
      ],
    ];

    for (const [label, postQuote] of disabledFlags) {
      it(`is rejected when the in-wallet withdraw flag is ${label}`, () => {
        expect(
          isPayRpcTypeAllowed(
            buildSource({ payRpc, postQuote }),
            PERPS_TERMINAL,
            'perpsWithdraw',
          ),
        ).toBe(false);
      });
    }

    it('does not affect perpsDeposit', () => {
      expect(
        isPayRpcTypeAllowed(
          buildSource({ payRpc, postQuote: { default: { enabled: false } } }),
          PERPS_TERMINAL,
          'perpsDeposit',
        ),
      ).toBe(true);
    });
  });
});
