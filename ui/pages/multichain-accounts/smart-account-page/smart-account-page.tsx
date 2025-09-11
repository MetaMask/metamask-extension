import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
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

export const SmartAccountPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const { address } = useParams<{ address: string }>();

  const decodedAddress = address ? decodeURIComponent(address) : null;

  if (!decodedAddress) {
    return null;
  }

  return (
    <Page className="max-w-[600px]">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.goBack()}
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
