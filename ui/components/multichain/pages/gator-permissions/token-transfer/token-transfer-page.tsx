import React from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Header, Page } from '../../page';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import {
  IconColor,
  BackgroundColor,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { GATOR_PERMISSIONS } from '../../../../../helpers/constants/routes';

export const TokenTransferPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  return (
    <Page
      className="main-container"
      data-testid="token-transfer-page"
      key="token-transfer-page"
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.iconDefault}
            onClick={() => navigate(GATOR_PERMISSIONS)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
          data-testid="token-transfer-page-title"
        >
          {t('tokenTransfer')}
        </Text>
      </Header>
    </Page>
  );
};
