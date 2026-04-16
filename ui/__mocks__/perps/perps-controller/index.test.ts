import { SUPPORT_CONFIG, FEEDBACK_CONFIG } from '.';

describe('@metamask/perps-controller mock – SUPPORT_CONFIG and FEEDBACK_CONFIG', () => {
  it('exports SUPPORT_CONFIG with the expected URL and UI keys', () => {
    expect(SUPPORT_CONFIG.Url).toBe(
      'https://support.metamask.io/?utm_source=extension',
    );
    expect(SUPPORT_CONFIG.TitleKey).toBe('perps.support.title');
    expect(SUPPORT_CONFIG.DescriptionKey).toBe('perps.support.description');
  });

  it('exports FEEDBACK_CONFIG with the expected URL and UI key', () => {
    expect(typeof FEEDBACK_CONFIG.Url).toBe('string');
    expect(FEEDBACK_CONFIG.TitleKey).toBe('perps.feedback.title');
  });
});
