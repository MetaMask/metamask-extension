import { rewriteRemovedSettingsToggles } from './response-parser';

describe('rewriteRemovedSettingsToggles', () => {
  it('points upgrade setup at Basic functionality', () => {
    expect(
      rewriteRemovedSettingsToggles(
        'import at least one NFT, hide one token, and turn OFF NFT auto-detection.',
      ),
    ).toBe(
      'import at least one NFT, hide one token, and turn OFF Basic functionality.',
    );
  });

  it('expects detection to follow Basic functionality after upgrade', () => {
    expect(
      rewriteRemovedSettingsToggles(
        'hidden token remains hidden, and NFT auto-detection remains OFF.',
      ),
    ).toBe(
      'hidden token remains hidden, and Basic functionality remains OFF (NFT detection follows it).',
    );
  });

  it('rewrites the removed Autodetect NFTs settings step', () => {
    expect(
      rewriteRemovedSettingsToggles('Turn OFF NFT auto-detection in Settings.'),
    ).toBe('Turn OFF Basic functionality in Settings → Security & privacy.');
  });

  it('rewrites NFT and token detection toggles to Basic functionality', () => {
    expect(
      rewriteRemovedSettingsToggles(
        'Toggle NFT auto-detection OFF and ON; observe NFT tab state.',
      ),
    ).toBe('Toggle Basic functionality OFF and ON; observe NFT tab state.');

    expect(
      rewriteRemovedSettingsToggles(
        'toggle Token auto-detection OFF and ON; observe Assets list changes.',
      ),
    ).toBe(
      'toggle Basic functionality OFF and ON; observe Assets list changes.',
    );
  });

  it('rewrites empty-state detection setup', () => {
    expect(
      rewriteRemovedSettingsToggles(
        'Ensure the current account has no NFTs and auto-detection is OFF.',
      ),
    ).toBe(
      'Ensure the current account has no NFTs and Basic functionality is OFF.',
    );

    expect(
      rewriteRemovedSettingsToggles('Turn ON NFT detection; revisit NFTs.'),
    ).toBe('Turn ON Basic functionality; revisit NFTs.');
  });

  it('does not leave the NFT label in front of Basic functionality', () => {
    expect(
      rewriteRemovedSettingsToggles('verify NFT auto-detection is ON'),
    ).toBe('verify Basic functionality is ON');
  });

  it('rewrites toggle when it comes before the removed control name', () => {
    expect(rewriteRemovedSettingsToggles('toggle Autodetect tokens')).toBe(
      'toggle Basic functionality',
    );
    expect(rewriteRemovedSettingsToggles('toggle Display NFT media')).toBe(
      'toggle Basic functionality',
    );
    expect(
      rewriteRemovedSettingsToggles(
        'Toggle Autodetect NFTs and confirm the NFT tab updates.',
      ),
    ).toBe('Toggle Basic functionality and confirm the NFT tab updates.');
  });

  it('leaves unrelated detection copy unchanged', () => {
    expect(
      rewriteRemovedSettingsToggles(
        'Verify phishing detection still blocks the malicious site.',
      ),
    ).toBe('Verify phishing detection still blocks the malicious site.');
  });
});
