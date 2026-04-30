import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SmartContractAccountToggleSection } from '../../../components/multichain-accounts/smart-contract-account-toggle-section';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { KEYRING_TYPES_SUPPORTING_7702 } from '../../../../shared/constants/keyring';
import { getInternalAccountByAddress } from '../../../selectors';

export const SmartAccountPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { address } = useParams<{ address: string }>();

  const decodedAddress = address ? decodeURIComponent(address) : null;
  const account = useSelector((state) =>
    decodedAddress ? getInternalAccountByAddress(state, decodedAddress) : null,
  );
  const keyringType = account?.metadata?.keyring?.type;
  const isEip7702SupportedKeyring =
    keyringType &&
    KEYRING_TYPES_SUPPORTING_7702.includes(keyringType as KeyringTypes);

  useEffect(() => {
    // This is added to prevent users from accessing the smart account page
    // by directly accessing the URL if the account does not support EIP-7702.
    if (decodedAddress && !isEip7702SupportedKeyring) {
      navigate(PREVIOUS_ROUTE);
    }
  }, [decodedAddress, isEip7702SupportedKeyring, navigate]);

  if (!decodedAddress) {
    return null;
  }

  if (!isEip7702SupportedKeyring) {
    return null;
  }

  return (
    <Page>
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => navigate(PREVIOUS_ROUTE)}
            data-testid="smart-account-page-back-button"
          />
        }
      >
        {t('smartAccount')}
      </Header>
      <Content>
        <Box flexDirection={BoxFlexDirection.Column}>
          <SmartContractAccountToggleSection address={decodedAddress} />
        </Box>
      </Content>
    </Page>
  );
};
