import type { Hex } from '@metamask/utils';

import type { PermissionRenderContext } from './permission-detail-schema.types';
import {
  PERMISSION_SCHEMAS,
  assertPermissionSchemaEntry,
} from './permission-detail-schemas';

function getJustificationGetValueFromSchema() {
  const entry = PERMISSION_SCHEMAS['native-token-stream'];
  for (const section of entry.sections) {
    for (const element of section.elements) {
      if (element.type === 'justification') {
        return element.getValue;
      }
    }
  }
  throw new Error(
    'Expected native-token-stream schema to include justification',
  );
}

function buildMinimalContext(
  justification: PermissionRenderContext['permission']['justification'],
): PermissionRenderContext {
  return {
    permission: {
      type: 'native-token-stream',
      data: {},
      justification,
    },
    expiry: null,
    chainId: '0x1' as Hex,
    origin: 'https://example.com',
  };
}

describe('justification field getValue', () => {
  it('returns the no-justification i18n value when justification is an empty string', () => {
    const getValue = getJustificationGetValueFromSchema();
    expect(getValue(buildMinimalContext(''))).toStrictEqual({
      key: 'gatorNoJustificationProvided',
    });
  });

  it('returns the no-justification i18n value when justification is undefined', () => {
    const getValue = getJustificationGetValueFromSchema();
    expect(getValue(buildMinimalContext(undefined))).toStrictEqual({
      key: 'gatorNoJustificationProvided',
    });
  });

  it('returns the site-provided justification text when non-empty', () => {
    const getValue = getJustificationGetValueFromSchema();
    expect(getValue(buildMinimalContext('Pay subscription'))).toBe(
      'Pay subscription',
    );
  });
});

describe('assertPermissionSchemaEntry', () => {
  it('throws with the permission type in the message when the registry has no entry', () => {
    expect(() =>
      assertPermissionSchemaEntry(
        'unregistered-type',
        PERMISSION_SCHEMAS['unregistered-type'],
      ),
    ).toThrow('Invalid permission type: unregistered-type');
  });

  it('does not throw for a registered type', () => {
    expect(() =>
      assertPermissionSchemaEntry(
        'native-token-stream',
        PERMISSION_SCHEMAS['native-token-stream'],
      ),
    ).not.toThrow();
  });
});
