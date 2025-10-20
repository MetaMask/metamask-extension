import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  IconColor,
  TextAlign,
  TextVariant,
} from '@metamask/design-system-react';
import { Header, Page } from '../../page';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { extractNetworkName } from '../helper';
import { getMultichainNetworkConfigurationsByChainId } from '../../../../../selectors';

export const ReviewGatorPermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const { chainId } = useParams();
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const getNetworkNameForChainId = () => {
    if (!chainId) {
      return t('unknownNetworkForGatorPermissions');
    }
    const networkNameKey = extractNetworkName(evmNetworks, chainId as Hex);
    const networkName = t(networkNameKey);

    // If the translation key doesn't exist (returns the same key), fall back to the full network name
    if (!networkName || networkName === networkNameKey) {
      return extractNetworkName(evmNetworks, chainId as Hex, true);
    }

    return networkName;
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
            color={IconColor.IconDefault}
            onClick={() => history.goBack()}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          variant={TextVariant.HeadingMd}
          textAlign={TextAlign.Center}
          data-testid="review-gator-permissions-page-title"
        >
          {getNetworkNameForChainId()}
        </Text>
      </Header>
    </Page>
  );
};
