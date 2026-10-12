import { useI18nContext } from '../../hooks/useI18nContext';
import { getNotificationsSettingsSectionConfigs } from './notifications-settings-types';

describe('getNotificationsSettingsSectionConfigs', () => {
  const t = ((key: string) => key) as ReturnType<typeof useI18nContext>;

  it('keeps marketing as the last section', () => {
    const sections = getNotificationsSettingsSectionConfigs(t);

    expect(sections.at(-1)?.type).toBe('marketing');
  });
});
