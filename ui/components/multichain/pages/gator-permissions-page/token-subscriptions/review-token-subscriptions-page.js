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
import {
  extractNetworkName,
  handleRevokeClick,
} from '../gator-permissions-page-helper';
import { ReviewGatorAssetItem } from '../components';
import { useRevokeGatorPermissions } from '../../../../../hooks/gator-permissions/useRevokeGatorPermissions';

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
  const erc20TokenPeriodicPermissions = useSelector((state) =>
    getGatorPermissionByPermissionTypeAndChainId(
      state,
      'erc20-token-periodic',
      chainId,
    ),
  );

  const { revokeGatorPermission, findDelegatorFromInternalAccounts } =
    useRevokeGatorPermissions({
      chainId,
    });

  useEffect(() => {
    setNetworkName(extractNetworkName(networks, chainId));
    setTotalTokenSubscriptions(nativeTokenPeriodicPermissions.length);
  }, [chainId, nativeTokenPeriodicPermissions, networks]);

  const renderTokenSubscriptions = (subscriptions) =>
    subscriptions.map((subscription) => {
      const { permissionResponse, siteOrigin } = subscription;
      const fullNetworkName = extractNetworkName(
        networks,
        permissionResponse.chainId,
        true,
      );
      return (
        <ReviewGatorAssetItem
          key={`${siteOrigin}-${permissionResponse.context}`}
          chainId={permissionResponse.chainId}
          networkName={fullNetworkName}
          permissionType={permissionResponse.permission.type}
          siteOrigin={siteOrigin}
          onRevokeClick={() =>
            handleRevokeClick({
              gatorPermission: subscription,
              findDelegatorFromInternalAccounts,
              revokeGatorPermission,
            })
          }
        />
      );
    });

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
          <>
            {renderTokenSubscriptions(nativeTokenPeriodicPermissions)}
            {renderTokenSubscriptions(erc20TokenPeriodicPermissions)}
          </>
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
