import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  StoredGatorPermissionSanitized,
  Signer,
  PermissionTypesWithCustom,
} from '@metamask/gator-permissions-controller';
import { Header, Page, Content } from '../../page';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  Box,
} from '../../../../component-library';
import {
  IconColor,
  BackgroundColor,
  TextAlign,
  TextVariant,
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  BlockSize,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { GATOR_PERMISSIONS } from '../../../../../helpers/constants/routes';
import {
  AppState,
  getAggregatedGatorPermissionsListAcrossAllChains,
} from '../../../../../selectors/gator-permissions/gator-permissions';
import { useRevokeGatorPermissions } from '../../../../../hooks/gator-permissions/useRevokeGatorPermissions';

export const TokenTransferPage = () => {
  const t = useI18nContext();
  const history = useHistory();

  const tokenTransferPermissions = useSelector((state: AppState) =>
    getAggregatedGatorPermissionsListAcrossAllChains(state, 'token-transfer'),
  );

  // Get the chain ID from the first permission (assuming all are on the same chain for this page)
  const chainId = tokenTransferPermissions[0]?.permissionResponse?.chainId;

  const { revokeGatorPermission } = useRevokeGatorPermissions({
    chainId: chainId || '0x1', // Default to mainnet if no permissions
    onRedirect: () => {
      console.log('🔄 Redirecting to confirmation...');
    },
  });

  const handlePermissionClick = async (
    permission: StoredGatorPermissionSanitized<
      Signer,
      PermissionTypesWithCustom
    >,
    index: number,
  ) => {
    console.log(`🔍 Permission ${index + 1} clicked:`, permission);
    console.log('📋 Permission details:', JSON.stringify(permission, null, 2));

    try {
      console.log('🚀 Calling revokeGatorPermission...');
      const transactionMeta = await revokeGatorPermission(permission);
      console.log('✅ Revocation transaction created:', transactionMeta);
    } catch (error) {
      console.error('❌ Error processing permission click:', error);
      const err = error as any;
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        data: err.data,
        stack: err.stack,
        cause: err.cause,
      });
      if (err.data) {
        console.error('❌ Error data:', JSON.stringify(err.data, null, 2));
      }
    }
  };

  const renderPermissionsList = () => {
    if (tokenTransferPermissions.length === 0) {
      return (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          height={BlockSize.Full}
          padding={4}
        >
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
          >
            {t('noTokenTransferPermissions')}
          </Text>
        </Box>
      );
    }

    return (
      <Box padding={4}>
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textDefault}
          marginBottom={3}
        >
          Found {tokenTransferPermissions.length} permissions:
        </Text>
        {tokenTransferPermissions.map((permission, index) => (
          <Box
            key={index}
            padding={3}
            marginBottom={2}
            style={{
              border: '1px solid var(--color-border-muted)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onClick={() => handlePermissionClick(permission, index)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'var(--color-background-alternative)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Text variant={TextVariant.bodyMdBold} marginBottom={1}>
              <strong>Site:</strong> {permission.siteOrigin}
            </Text>
            <Text variant={TextVariant.bodySm} marginBottom={1}>
              <strong>Type:</strong>{' '}
              {permission.permissionResponse.permission.type}
            </Text>
            <Text variant={TextVariant.bodySm} marginBottom={1}>
              <strong>Chain:</strong> {permission.permissionResponse.chainId}
            </Text>
            <Text variant={TextVariant.bodySm}>
              <strong>Context:</strong> {permission.permissionResponse.context}
            </Text>
          </Box>
        ))}
      </Box>
    );
  };

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
            onClick={() => history.push(GATOR_PERMISSIONS)}
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
      <Content padding={0}>{renderPermissionsList()}</Content>
    </Page>
  );
};
