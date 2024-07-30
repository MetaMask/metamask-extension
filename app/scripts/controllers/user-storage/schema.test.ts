import { USER_STORAGE_ENTRIES, createEntryPath } from './schema';

describe('schema.ts - createEntryPath()', () => {
  const MOCK_STORAGE_KEY = 'MOCK_STORAGE_KEY';

  test('creates a valid entry path', () => {
    const result = createEntryPath('notification_settings', MOCK_STORAGE_KEY);

    // Ensures that the path and the entry name are correct.
    // If this differs then indicates a potential change on how this path is computed
    const expected = `/${USER_STORAGE_ENTRIES.notification_settings.path}/50f65447980018849b991e038d7ad87de5cf07fbad9736b0280e93972e17bac8`;
    expect(result).toBe(expected);
  });

  test('Should throw if using an entry that does not exist', () => {
    expect(() => {
      // @ts-expect-error mocking a fake entry for testing.
      createEntryPath('fake_entry');
    }).toThrow();
  });
});
