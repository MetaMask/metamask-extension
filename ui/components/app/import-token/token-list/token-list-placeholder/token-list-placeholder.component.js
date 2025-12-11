import React from 'react';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTheme } from '../../../../../hooks/useTheme';
import { TabEmptyState } from '../../../../ui/tab-empty-state/tab-empty-state';
import { ThemeType } from '../../../../../../shared/constants/preferences';

export default function TokenListPlaceholder() {
  const t = useI18nContext();
  const theme = useTheme();

  const tokenIcon =
    theme === ThemeType.dark
      ? '/images/empty-state-tokens-dark.png'
      : '/images/empty-state-tokens-light.png';

  return (
    <TabEmptyState
      icon={<img src={tokenIcon} alt={t('tokens')} width={72} height={72} />}
      description={t('addAcquiredTokens')}
      actionButtonText={t('learnMoreUpperCase')}
      actionButtonProps={{
        href: ZENDESK_URLS.ADD_CUSTOM_TOKENS,
        externalLink: true,
      }}
      className="mx-auto"
    />
  );
}
