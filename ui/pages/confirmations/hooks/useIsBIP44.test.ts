import { useIsBIP44 } from './useIsBIP44';

describe('useIsBIP44', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true since multichain accounts (bip44) is now ON by default', () => {
    const result = useIsBIP44();

    expect(result).toBe(true);
  });
});
