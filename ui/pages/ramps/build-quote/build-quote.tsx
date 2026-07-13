import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { Header, Page, Content } from '../../../components/multichain/pages/page';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

/**
 * Placeholder for the native ramps build-quote page.
 *
 * `useRampsNavigation.goToBuy` routes here once a supported token has been
 * pre-selected. The real quote UI lands in a follow-up ticket (TRAM-3714+).
 *
 * bare stub — body is intentionally empty until TRAM-3714+.
 */
export default function BuildQuote() {
  const t = useI18nContext();
  const navigate = useNavigate();

  return (
    <Page data-testid="ramps-build-quote-page">
      <Header
        startAccessory={
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            onClick={() => navigate(DEFAULT_ROUTE)}
          />
        }
      >
        {t('buy')}
      </Header>
      <Content>
        <div className="w-full text-center">Build Quote Stub</div>
      </Content>
    </Page>
  );
}
