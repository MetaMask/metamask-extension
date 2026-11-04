import { isProduction } from '../../../../shared/lib/environment';
import { isMfaDevBuild } from './isMfaDevBuild';

jest.mock('../../../../shared/lib/environment', () => ({
  isProduction: jest.fn(),
}));

const mockIsProduction = jest.mocked(isProduction);

describe('isMfaDevBuild', () => {
  it('returns false in production builds', () => {
    mockIsProduction.mockReturnValue(true);
    expect(isMfaDevBuild()).toBe(false);
  });

  it('returns true in development and test builds', () => {
    mockIsProduction.mockReturnValue(false);
    expect(isMfaDevBuild()).toBe(true);
  });
});
