import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Content, Header, Page } from '../page';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../component-library';
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
} from '../../../../helpers/constants/design-system';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { getAggregatedGatorPermissionByChainId } from '../../../../selectors/gator-permissions/gator-permissions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useRevokeGatorPermissions } from '../../../../hooks/gator-permissions/useRevokeGatorPermissions';
import { extractNetworkName } from './gator-permissions-page-helper';
import { ReviewGatorAssetItem } from './components';

export const ReviewGatorPermissionsPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const headerRef = useRef();
  const { chainId, aggregatedPermissionType } = useParams();
  const [networkName, setNetworkName] = useState('');
  const [totalGatorPermissions, setTotalGatorPermissions] = useState(0);

  const networks = useSelector(getNetworkConfigurationsByChainId);
  const gatorPermissions = useSelector((state) =>
    getAggregatedGatorPermissionByChainId(
      state,
      aggregatedPermissionType,
      chainId,
    ),
  );

  const { revokeGatorPermission } = useRevokeGatorPermissions({
    chainId,
  });

  useEffect(() => {
    setNetworkName(extractNetworkName(networks, chainId));
    setTotalGatorPermissions(gatorPermissions.length);
  }, [chainId, gatorPermissions, networks]);

  const handleRevokeClick = async (permission) => {
    try {
      console.log('permission to revoke:', permission);
      await revokeGatorPermission(permission);
    } catch (error) {
      console.error('Error revoking gator permission:', error);
    }
  };

  const renderGatorPermissions = (permissions) =>
    permissions.map((permission) => {
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
          onRevokeClick={() => handleRevokeClick(permission)}
        />
      );
    });

  return (
    <Page
      className="main-container"
      data-testid="review-gator-permissions-page"
    >
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
        {totalGatorPermissions > 0 ? (
          renderGatorPermissions(gatorPermissions)
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
