import React, { useCallback } from 'react';

import { useHistory } from 'react-router-dom';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant as LegacyTextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ImportAccount } from '../../../components/multichain/import-account/import-account';

/**
 *
 * TODO: This page will eventually handle both SRP and Private Key account imports
 * For now, it only handles Private Key account imports
 */
export const AddWalletPage = () => {
  const t = useI18nContext();
  const history = useHistory();

  const onActionComplete = useCallback(
    async (confirmed: boolean) => {
      if (confirmed) {
        history.goBack();
      }
    },
    [history],
  );

  return (
    <Page className="max-w-[600px]">
      <Header
        textProps={{
          variant: LegacyTextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.goBack()}
            data-testid="add-wallet-page-back-button"
          />
        }
      >
        {t('addWallet')}
      </Header>
      <Content>
        <Text variant={TextVariant.HeadingSm}>{t('privateKey')}</Text>
        <ImportAccount onActionComplete={onActionComplete} />
      </Content>
    </Page>
  );
};
