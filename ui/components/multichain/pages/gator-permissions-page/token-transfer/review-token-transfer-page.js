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
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { getAggregatedGatorPermissionByChainId } from '../../../../../selectors/gator-permissions/gator-permissions';
import { extractNetworkName } from '../gator-permissions-page-helper';
import { ReviewGatorAssetItem } from '../components';

export const ReviewTokenTransferPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const { chainId } = useParams();
  const [networkName, setNetworkName] = useState('');
  const [totalTokenTransferPermissions, setTotalTokenTransferPermissions] =
    useState(0);

  const networks = useSelector(getNetworkConfigurationsByChainId);

  // Get aggregated token transfer permissions for the specific chain
  const aggregatedTokenTransferPermissions = useSelector((state) =>
    getAggregatedGatorPermissionByChainId(state, 'token-transfer', chainId),
  );

  useEffect(() => {
    setNetworkName(extractNetworkName(networks, chainId));
    setTotalTokenTransferPermissions(aggregatedTokenTransferPermissions.length);
  }, [chainId, aggregatedTokenTransferPermissions, networks]);

  const handlePermissionRevokeClick = (permission) => {
    // TODO: Implement revoke logic
    console.log('Permission to revoke:', permission);
  };

  const renderTokenTransferPermissions = () =>
    aggregatedTokenTransferPermissions.map((permission) => {
      const { permissionResponse, siteOrigin } = permission;
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
          onRevokeClick={() => handlePermissionRevokeClick(permission)}
        />
      );
    });

  return (
    <Page className="main-container" data-testid="review-token-transfer-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={Color.iconDefault}
            onClick={() => history.goBack()}
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
        {totalTokenTransferPermissions > 0 ? (
          renderTokenTransferPermissions()
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
