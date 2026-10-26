import { isProduction } from '../../../../shared/lib/environment';
import { isMfaKitEnabled } from './isMfaKitEnabled';

jest.mock('../../../../shared/lib/environment', () => ({
  isProduction: jest.fn(),
}));

const mockIsProduction = jest.mocked(isProduction);

describe('isMfaKitEnabled', () => {
  it('returns false in production builds', () => {
    mockIsProduction.mockReturnValue(true);
    expect(isMfaKitEnabled()).toBe(false);
  });

  it('returns true in development and test builds', () => {
    mockIsProduction.mockReturnValue(false);
    expect(isMfaKitEnabled()).toBe(true);
  });
});
