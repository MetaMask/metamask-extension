import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
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
import { NETWORK_TO_NAME_MAP } from '../../../../../../shared/constants/network';

export const ReviewGatorPermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const { chainId } = useParams();
  const getNetworkNameForChainId = () => {
    const networkName =
      NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP];
    return networkName ? t(networkName) : t('privateNetwork');
  };

  return (
    <Page
      className="main-container"
      data-testid="review-gator-permissions-page"
      key="review-gator-permissions-page"
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={IconColor.iconDefault}
            onClick={() => history.goBack()}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
          data-testid="review-gator-permissions-page-title"
        >
          {getNetworkNameForChainId()}
        </Text>
      </Header>
    </Page>
  );
};
