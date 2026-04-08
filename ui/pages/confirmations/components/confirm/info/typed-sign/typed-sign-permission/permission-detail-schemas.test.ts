import { BigNumber } from 'bignumber.js';
import { PERMISSION_SCHEMAS } from './permission-detail-schemas';
import type { PermissionRenderContext } from './permission-detail-schema.types';
import { MAX_UINT256 } from './typed-sign-permission-util';

function buildCtx(
  overrides: Partial<PermissionRenderContext> = {},
): PermissionRenderContext {
  return {
    permission: { type: 'test', data: {} },
    expiry: null,
    chainId: '0x1',
    origin: 'https://example.com',
    tokenInfo: { symbol: 'ETH', decimals: 18, imageUrl: 'eth.png' },
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

  describe('views annotations', () => {
    it('common section elements are confirmation-only', () => {
      const schema = PERMISSION_SCHEMAS['native-token-periodic'];
      // justification section
      for (const el of schema.sections[0].elements) {
        expect('views' in el && el.views).toEqual(['confirmation']);
      }
      // permission info section
      for (const el of schema.sections[1].elements) {
        expect('views' in el && el.views).toEqual(['confirmation']);
      }
    });

    it('dividers are confirmation-only', () => {
      const schema = PERMISSION_SCHEMAS['native-token-periodic'];
      const dividers = schema.sections
        .flatMap((s) => s.elements)
        .filter((e) => e.type === 'divider');
      for (const d of dividers) {
        expect(d.views).toEqual(['confirmation']);
      }
    });

    it('fields with reviewLabelKey appear in all views (no views restriction)', () => {
      const schema = PERMISSION_SCHEMAS['native-token-stream'];
      const fieldsWithReviewKey = schema.sections
        .flatMap((s) => s.elements)
        .filter((e) => 'reviewLabelKey' in e && e.reviewLabelKey);
      expect(fieldsWithReviewKey.length).toBeGreaterThan(0);
      for (const f of fieldsWithReviewKey) {
        expect('views' in f ? f.views : undefined).toBeUndefined();
      }
    });
  });

  describe('summary', () => {
    it('native-token-periodic has hex amount and frequency', () => {
      const schema = PERMISSION_SCHEMAS['native-token-periodic'];
      expect(schema.summary).toBeDefined();
      expect(schema.summary?.amount.labelKey).toBe('amount');
      expect('getHexValue' in schema.summary!.amount).toBe(true);
      expect(schema.summary?.frequency).toBeDefined();

      const ctx = buildCtx({
        permission: {
          type: 'native-token-periodic',
          data: { periodAmount: '0xabc', periodDuration: 86400, startTime: 1 },
        },
      });
      if ('getHexValue' in schema.summary!.amount) {
        expect(schema.summary!.amount.getHexValue(ctx)).toBe('0xabc');
      }
    });

    it('native-token-stream has hex amount and weekly frequency', () => {
      const schema = PERMISSION_SCHEMAS['native-token-stream'];
      expect(schema.summary).toBeDefined();
      expect('getHexValue' in schema.summary!.amount).toBe(true);
      expect(schema.summary?.frequency?.getValueKey(buildCtx())).toBe(
        'gatorPermissionWeeklyFrequency',
      );
    });

    it('erc20-token-revocation has i18n amount and no frequency', () => {
      const schema = PERMISSION_SCHEMAS['erc20-token-revocation'];
      expect(schema.summary).toBeDefined();
      expect('getI18nValue' in schema.summary!.amount).toBe(true);
      if ('getI18nValue' in schema.summary!.amount) {
        expect(schema.summary!.amount.getI18nValue(buildCtx())).toEqual({
          key: 'allTokens',
        });
      }
      expect(schema.summary?.frequency).toBeUndefined();
    });
  });

  describe('common sections', () => {
    const schema = PERMISSION_SCHEMAS['native-token-periodic'];
    const justificationSection = schema.sections[0];
    const permissionInfoSection = schema.sections[1];

    it('justification is hidden when not present', () => {
      const ctx = buildCtx({
        permission: { type: 'test', data: {} },
      });
      const field = justificationSection.elements[0];
      if ('isVisible' in field && field.isVisible) {
        expect(field.isVisible(ctx)).toBe(false);
      }
    });

    it('justification is visible when present', () => {
      const ctx = buildCtx({
        permission: {
          type: 'test',
          data: {},
          justification: 'Monthly subscription',
        },
      });
      const field = justificationSection.elements[0];
      if ('isVisible' in field && field.isVisible) {
        expect(field.isVisible(ctx)).toBe(true);
      }
    });

    it('account field is always present', () => {
      expect(justificationSection.elements[1].type).toBe('account');
    });

    it('origin field is first in permission info section', () => {
      expect(permissionInfoSection.elements[0].type).toBe('origin');
    });

    it('address field is hidden when to is not present', () => {
      const ctx = buildCtx();
      const field = permissionInfoSection.elements[1];
      if ('isVisible' in field && field.isVisible) {
        expect(field.isVisible(ctx)).toBe(false);
      }
    });

    it('address field is visible when to is present', () => {
      const ctx = buildCtx({ to: '0x1234' });
      const field = permissionInfoSection.elements[1];
      if ('isVisible' in field && field.isVisible) {
        expect(field.isVisible(ctx)).toBe(true);
      }
    });

    it('address field extracts to from context', () => {
      const ctx = buildCtx({ to: '0xRecipient' });
      const field = permissionInfoSection.elements[1];
      if (field.type === 'address' && 'getAddress' in field) {
        expect(field.getAddress(ctx)).toBe('0xRecipient');
      }
    });

    it('network field is last in permission info section', () => {
      expect(permissionInfoSection.elements[2].type).toBe('network');
    });
  });

  describe('native-token-periodic', () => {
    const schema = PERMISSION_SCHEMAS['native-token-periodic'];

    it('has native tokenResolution', () => {
      expect(schema.tokenResolution).toEqual({ kind: 'native' });
    });

    it('has native tokenVariant', () => {
      expect(schema.tokenVariant).toBe('native');
    });

    it('validate throws when startTime is missing', () => {
      expect(() => schema.validate?.({ data: {} })).toThrow(
        'Start time is required',
      );
    });

    it('validate does not throw when startTime is present', () => {
      expect(() =>
        schema.validate?.({ data: { startTime: 123 } }),
      ).not.toThrow();
    });

    it('has 3 sections (justification, permissionInfo, details)', () => {
      expect(schema.sections).toHaveLength(3);
      expect(schema.sections[0].testId).toBe(
        'confirmation_justification-section',
      );
      expect(schema.sections[1].testId).toBe('confirmation_permission-section');
      expect(schema.sections[2].testId).toBe(
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
      const allowanceField = schema.sections[2].elements[0];
      expect(allowanceField.type).toBe('amount');
      if (allowanceField.type === 'amount') {
        expect(allowanceField.getValue(ctx)).toEqual(new BigNumber('0xabc'));
      }
    });

    it('frequency field returns daily i18n key', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-periodic',
          data: { periodAmount: '0x1', periodDuration: 86400, startTime: 1 },
        },
      });
      const freqField = schema.sections[2].elements[1];
      if (freqField.type === 'text') {
        expect(freqField.getValue(ctx)).toEqual({
          key: 'confirmFieldPeriodDurationDaily',
        });
      }
    });

    it('date field extracts startTime', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-periodic',
          data: { periodAmount: '0x1', periodDuration: 86400, startTime: 999 },
        },
      });
      const dateField = schema.sections[2].elements[3];
      if (dateField.type === 'date') {
        expect(dateField.getTimestamp(ctx)).toBe(999);
      }
    });
  });

  describe('native-token-stream', () => {
    const schema = PERMISSION_SCHEMAS['native-token-stream'];

    it('validate throws when startTime is missing', () => {
      expect(() => schema.validate?.({ data: {} })).toThrow(
        'Start time is required',
      );
    });

    it('has 4 sections (justification, permissionInfo, details, streamRate)', () => {
      expect(schema.sections).toHaveLength(4);
      expect(schema.sections[2].testId).toBe(
        'native-token-stream-details-section',
      );
      expect(schema.sections[3].testId).toBe(
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
      const field = schema.sections[2].elements[0];
      if ('isVisible' in field && field.isVisible) {
        expect(field.isVisible(ctx)).toBe(false);
      }
    });

    it('initialAmount is visible when present', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-stream',
          data: { initialAmount: '0x1', amountPerSecond: '0x1', startTime: 1 },
        },
      });
      const field = schema.sections[2].elements[0];
      if ('isVisible' in field && field.isVisible) {
        expect(field.isVisible(ctx)).toBe(true);
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
      const field = schema.sections[2].elements[1];
      if ('isVisible' in field && field.isVisible) {
        expect(field.isVisible(ctx)).toBe(false);
      }
    });

    it('maxAmount is visible when set to a normal value', () => {
      const ctx = buildCtx({
        permission: {
          type: 'native-token-stream',
          data: { maxAmount: '0x1234', amountPerSecond: '0x1', startTime: 1 },
        },
      });
      const field = schema.sections[2].elements[1];
      if ('isVisible' in field && field.isVisible) {
        expect(field.isVisible(ctx)).toBe(true);
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
      const field = schema.sections[3].elements[2];
      if (field.type === 'totalExposure') {
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

    it('has erc20 tokenVariant', () => {
      expect(schema.tokenVariant).toBe('erc20');
    });

    it('amount field extracts tokenAddress via getTokenAddress', () => {
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
      const field = schema.sections[2].elements[0];
      if (field.type === 'amount') {
        expect(field.getTokenAddress?.(ctx)).toBe('0xTok');
        expect(field.getValue(ctx)).toEqual(new BigNumber('0x1'));
      }
    });
  });

  describe('erc20-token-stream', () => {
    const schema = PERMISSION_SCHEMAS['erc20-token-stream'];

    it('has 4 sections', () => {
      expect(schema.sections).toHaveLength(4);
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
      const field = schema.sections[2].elements[1];
      if ('isVisible' in field && field.isVisible) {
        expect(field.isVisible(ctx)).toBe(false);
      }
    });

    it('totalExposure schema entry has erc20 tokenVariant', () => {
      expect(schema.tokenVariant).toBe('erc20');
    });
  });

  describe('erc20-token-revocation', () => {
    const schema = PERMISSION_SCHEMAS['erc20-token-revocation'];

    it('has no tokenResolution', () => {
      expect(schema.tokenResolution).toEqual({ kind: 'none' });
    });

    it('has none tokenVariant', () => {
      expect(schema.tokenVariant).toBe('none');
    });

    it('has no validate function', () => {
      expect(schema.validate).toBeUndefined();
    });

    it('has 3 sections (justification, permissionInfo, details)', () => {
      expect(schema.sections).toHaveLength(3);
      expect(schema.sections[2].elements).toHaveLength(1);
      expect(schema.sections[2].elements[0].type).toBe('expiry');
    });

    it('has correct testId', () => {
      expect(schema.sections[2].testId).toBe(
        'erc20-token-revocation-details-section',
      );
    });
  });
});
