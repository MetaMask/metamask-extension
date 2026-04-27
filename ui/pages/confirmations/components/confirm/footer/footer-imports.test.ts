import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('confirm footer imports', () => {
  it('keeps hardware-wallet-footer from importing footer', () => {
    const hardwareWalletFooterSource = readFileSync(
      join(__dirname, 'hardware-wallet-footer.tsx'),
      'utf8',
    );

    expect(hardwareWalletFooterSource).not.toContain("from './footer'");
  });
});
