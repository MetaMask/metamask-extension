import { PERMISSION_SCHEMAS } from './permission-detail-schemas';
import type { PermissionContext } from './permission-detail-schema.types';
import { MAX_UINT256 } from './typed-sign-permission-util';

const mockT = ((key: string) => key) as PermissionContext['t'];

function buildCtx(
  overrides: Partial<PermissionContext> = {},
): PermissionContext {
  return {
    permission: { type: 'test', data: {} },
    expiry: null,
    chainId: '0x1',
    t: mockT,
    nativeToken: { symbol: 'ETH', decimals: 18, imageUrl: 'eth.png' },
    erc20Decimals: 18,
    ...overrides,
  };
}

describe('PERMISSION_SCHEMAS', () => {
  describe('registry', () => {
    it('contains all 5 permission types', () => {
      expect(Object.keys(PERMISSION_SCHEMAS)).toEqual([
        'native-token-periodic',
        'native-token-stream',
        'erc20-token-periodic',
        'erc20-token-stream',
        'erc20-token-revocation',
      ]);
    });
  });

  describe('native-token-periodic', () => {
    const schema = PERMISSION_SCHEMAS['native-token-periodic'];

    it('has native tokenResolution', () => {
      expect(schema.tokenResolution).toEqual({ kind: 'native' });
    });

    it('validate throws when startTime is missing', () => {
      expect(() => schema.validate!({ data: {} })).toThrow(
        'Start time is required',
      );
    });

    it('validate does not throw when startTime is present', () => {
      expect(() =>
        schema.validate!({ data: { startTime: 123 } }),
      ).not.toThrow();
    });

    it('has 1 section with correct testId', () => {
      expect(schema.sections).toHaveLength(1);
      expect(schema.sections[0].testId).toBe(
        'native-token-periodic-details-section',
      );
    });

    it('allowance field extracts periodAmount', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-periodic',
          data: { periodAmount: '0xabc', periodDuration: 86400, startTime: 1 },
        },
      });
      const allowanceField = schema.sections[0].elements[0];
      expect(allowanceField.type).toBe('nativeAmount');
      if (allowanceField.type === 'nativeAmount') {
        expect(allowanceField.getValue(ctx)).toBe('0xabc');
      }
    });

    it('frequency field calls formatPeriodDuration', () => {
      const tSpy = jest.fn((key: string) => key);
      const ctx = buildCtx({
        permission: {
          type: 'native-token-periodic',
          data: { periodAmount: '0x1', periodDuration: 86400, startTime: 1 },
        },
        t: tSpy as unknown as PermissionContext['t'],
      });
      const freqField = schema.sections[0].elements[1];
      if (freqField.type === 'text') {
        freqField.getValue(ctx);
        expect(tSpy).toHaveBeenCalledWith('confirmFieldPeriodDurationDaily');
      }
    });

    it('date field extracts startTime', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-periodic',
          data: { periodAmount: '0x1', periodDuration: 86400, startTime: 999 },
        },
      });
      const dateField = schema.sections[0].elements[3];
      if (dateField.type === 'date') {
        expect(dateField.getTimestamp(ctx)).toBe(999);
      }
    });
  });

  describe('native-token-stream', () => {
    const schema = PERMISSION_SCHEMAS['native-token-stream'];

    it('validate throws when startTime is missing', () => {
      expect(() => schema.validate!({ data: {} })).toThrow(
        'Start time is required',
      );
    });

    it('has 2 sections', () => {
      expect(schema.sections).toHaveLength(2);
      expect(schema.sections[0].testId).toBe(
        'native-token-stream-details-section',
      );
      expect(schema.sections[1].testId).toBe(
        'native-token-stream-stream-rate-section',
      );
    });

    it('initialAmount is hidden when not present', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-stream',
          data: { amountPerSecond: '0x1', startTime: 1 },
        },
      });
      const field = schema.sections[0].elements[0];
      if ('visible' in field && field.visible) {
        expect(field.visible(ctx)).toBe(false);
      }
    });

    it('initialAmount is visible when present', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-stream',
          data: { initialAmount: '0x1', amountPerSecond: '0x1', startTime: 1 },
        },
      });
      const field = schema.sections[0].elements[0];
      if ('visible' in field && field.visible) {
        expect(field.visible(ctx)).toBe(true);
      }
    });

    it('maxAmount is hidden when equal to MAX_UINT256', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-stream',
          data: {
            maxAmount: MAX_UINT256,
            amountPerSecond: '0x1',
            startTime: 1,
          },
        },
      });
      const field = schema.sections[0].elements[1];
      if ('visible' in field && field.visible) {
        expect(field.visible(ctx)).toBe(false);
      }
    });

    it('maxAmount is visible when set to a normal value', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-stream',
          data: { maxAmount: '0x1234', amountPerSecond: '0x1', startTime: 1 },
        },
      });
      const field = schema.sections[0].elements[1];
      if ('visible' in field && field.visible) {
        expect(field.visible(ctx)).toBe(true);
      }
    });

    it('totalExposure extracts stream params', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-stream',
          data: {
            initialAmount: '0xa',
            maxAmount: '0xb',
            amountPerSecond: '0xc',
            startTime: 100,
          },
        },
      });
      const field = schema.sections[1].elements[2];
      if (field.type === 'totalExposure') {
        expect(field.variant).toBe('native');
        expect(field.getStreamParams(ctx)).toEqual({
          initialAmount: '0xa',
          maxAmount: '0xb',
          amountPerSecond: '0xc',
          startTime: 100,
        });
      }
    });
  });

  describe('erc20-token-periodic', () => {
    const schema = PERMISSION_SCHEMAS['erc20-token-periodic'];

    it('has erc20 tokenResolution', () => {
      expect(schema.tokenResolution.kind).toBe('erc20');
      if (schema.tokenResolution.kind === 'erc20') {
        expect(
          schema.tokenResolution.getTokenAddress({
            data: { tokenAddress: '0xToken' },
          }),
        ).toBe('0xToken');
      }
    });

    it('tokenAmount field extracts tokenAddress', () => {
      const ctx = buildCtx({
        permission: {
          type: 'erc20-token-periodic',
          data: {
            tokenAddress: '0xTok',
            periodAmount: '0x1',
            periodDuration: 604800,
            startTime: 1,
          },
        },
      });
      const field = schema.sections[0].elements[0];
      if (field.type === 'tokenAmount') {
        expect(field.getTokenAddress(ctx)).toBe('0xTok');
        expect(field.getValue(ctx)).toBe('0x1');
      }
    });
  });

  describe('erc20-token-stream', () => {
    const schema = PERMISSION_SCHEMAS['erc20-token-stream'];

    it('has 2 sections', () => {
      expect(schema.sections).toHaveLength(2);
    });

    it('maxAmount visibility respects MAX_UINT256', () => {
      const ctx = buildCtx({
        permission: {
          type: 'erc20-token-stream',
          data: {
            tokenAddress: '0xTok',
            maxAmount: MAX_UINT256,
            amountPerSecond: '0x1',
            startTime: 1,
          },
        },
      });
      const field = schema.sections[0].elements[1];
      if ('visible' in field && field.visible) {
        expect(field.visible(ctx)).toBe(false);
      }
    });

    it('totalExposure has erc20 variant', () => {
      const field = schema.sections[1].elements[2];
      if (field.type === 'totalExposure') {
        expect(field.variant).toBe('erc20');
      }
    });
  });

  describe('erc20-token-revocation', () => {
    const schema = PERMISSION_SCHEMAS['erc20-token-revocation'];

    it('has no tokenResolution', () => {
      expect(schema.tokenResolution).toEqual({ kind: 'none' });
    });

    it('has no validate function', () => {
      expect(schema.validate).toBeUndefined();
    });

    it('has 1 section with only expiry', () => {
      expect(schema.sections).toHaveLength(1);
      expect(schema.sections[0].elements).toHaveLength(1);
      expect(schema.sections[0].elements[0].type).toBe('expiry');
    });

    it('has correct testId', () => {
      expect(schema.sections[0].testId).toBe(
        'erc20-token-revocation-details-section',
      );
    });
  });
});
