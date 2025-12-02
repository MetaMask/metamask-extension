import React from 'react';
import { useNavigate, useParams } from 'react-router-dom-v5-compat';
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

type SmartAccountPageProps = {
  params?: { address: string };
};

export const SmartAccountPage = ({
  params: propsParams,
}: SmartAccountPageProps = {}) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const hookParams = useParams<{ address: string }>();

  const { address } = propsParams || hookParams;

  const decodedAddress = address ? decodeURIComponent(address) : null;

  if (!decodedAddress) {
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
