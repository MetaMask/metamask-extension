import { promises as fs } from 'fs';
import path from 'path';
import { validateExtensionBuilt } from './validate-extension';

jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
  },
}));

const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;

describe('validateExtensionBuilt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves with the extension path when manifest exists', async () => {
    mockAccess.mockResolvedValue(undefined);

    const result = await validateExtensionBuilt('/custom/path');

    expect(result).toBe('/custom/path');
    expect(mockAccess).toHaveBeenCalledWith(
      path.join('/custom/path', 'manifest.json'),
    );
  });

  it('uses default dist/chrome path when no path is provided', async () => {
    mockAccess.mockResolvedValue(undefined);

    const result = await validateExtensionBuilt();

    const expectedDefault = path.join(process.cwd(), 'dist', 'chrome');
    expect(result).toBe(expectedDefault);
    expect(mockAccess).toHaveBeenCalledWith(
      path.join(expectedDefault, 'manifest.json'),
    );
  });

  it('throws descriptive error when manifest is missing', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    await expect(validateExtensionBuilt('/missing/path')).rejects.toThrow(
      'Extension not built.',
    );
  });

  it('includes manifest path in error message', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    await expect(validateExtensionBuilt('/missing/path')).rejects.toThrow(
      path.join('/missing/path', 'manifest.json'),
    );
  });

  it('includes build command in error message', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'));

    await expect(validateExtensionBuilt('/missing/path')).rejects.toThrow(
      'yarn build:test',
    );
  });
});
