import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Content, Header, Page } from '../../page';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  Color,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { TOKEN_SUBSCRIPTIONS_ROUTE } from '../../../../../helpers/constants/routes';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { getGatorPermissionByPermissionTypeAndChainId } from '../../../../../selectors/gator-permissions/gator-permissions';

export const ReviewTokenSubscriptionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const { chainId } = useParams();
  const [networkName, setNetworkName] = useState('');
  const [totalTokenSubscriptions, setTotalTokenSubscriptions] = useState(0);

  const networks = useSelector(getNetworkConfigurationsByChainId);
  const nativeTokenPeriodicPermissions = useSelector((state) =>
    getGatorPermissionByPermissionTypeAndChainId(
      state,
      'native-token-periodic',
      chainId,
    ),
  );

  useEffect(() => {
    const network = networks[chainId];
    if (network?.name && network?.name !== '') {
      setNetworkName(`networkName${network.name.split(' ')[0]}`);
    } else {
      setNetworkName('unknownNetworkForGatorPermissions');
    }
    setTotalTokenSubscriptions(nativeTokenPeriodicPermissions.length);
  }, [chainId, nativeTokenPeriodicPermissions, networks]);

  const handleRevokeClick = (subscriptions) => {
    // TODO: Implement revoke logic
    console.log('subscriptions to revoke:', subscriptions);
  };

  const renderTokenSubscriptions = (subscriptions) => {
    return (
      <Box>
        <Text>{JSON.stringify(subscriptions)}</Text>
        <ButtonIcon
          iconName={IconName.Trash}
          onClick={() => handleRevokeClick(subscriptions)}
        />
      </Box>
    );
  };

  return (
    <Page
      className="main-container"
      data-testid="review-token-subscriptions-page"
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={Color.iconDefault}
            onClick={() => history.push(TOKEN_SUBSCRIPTIONS_ROUTE)}
            size={ButtonIconSize.Sm}
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
        >
          {t(networkName)}
        </Text>
      </Header>
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {totalTokenSubscriptions > 0 ? (
          renderTokenSubscriptions(nativeTokenPeriodicPermissions)
        ) : (
          <Box
            data-testid="no-connections"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            height={BlockSize.Full}
            gap={2}
            padding={4}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              backgroundColor={BackgroundColor.backgroundDefault}
              textAlign={TextAlign.Center}
            >
              {t('permissionsPageEmptyContent')}
            </Text>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              backgroundColor={BackgroundColor.backgroundDefault}
              textAlign={TextAlign.Center}
            >
              {t('permissionsPageEmptySubContent')}
            </Text>
          </Box>
        )}
      </Content>
    </Page>
  );
};
