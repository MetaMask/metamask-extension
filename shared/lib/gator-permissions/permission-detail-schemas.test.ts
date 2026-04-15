import {
  PERMISSION_SCHEMAS,
  assertPermissionSchemaEntry,
} from './permission-detail-schemas';

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
