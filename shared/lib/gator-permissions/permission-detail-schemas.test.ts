import { captureMessage } from '../sentry';
import { getPermissionSchemaEntry } from './permission-detail-schemas';

jest.mock('../sentry', () => ({
  captureMessage: jest.fn(),
}));

describe('getPermissionSchemaEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the schema for a known permission type', () => {
    const schema = getPermissionSchemaEntry('native-token-stream');
    expect(schema.tokenVariant).toBe('native');
  });

  it('does not report known permission types to Sentry', () => {
    getPermissionSchemaEntry('native-token-stream');
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('reports unknown permission types to Sentry', () => {
    getPermissionSchemaEntry('unregistered-type');
    expect(captureMessage).toHaveBeenCalledWith(
      'Unknown advanced permission type encountered',
      { extra: { permissionType: 'unregistered-type' } },
    );
  });

  it('does not report to Sentry when throwIfUnknown is true', () => {
    expect(() => getPermissionSchemaEntry('unregistered-type', true)).toThrow(
      'Unknown permission type: unregistered-type',
    );
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('falls back to unknown schema when no matching type exists', () => {
    const unknownSchema = getPermissionSchemaEntry('unregistered-type');
    const unknownTypeElement = unknownSchema.sections
      .flatMap((section) => section.elements)
      .find(
        (element) =>
          'testId' in element &&
          element.testId === 'review-gator-permission-unknown-type',
      );

    expect(unknownTypeElement?.type).toBe('raw-text');
  });
});
