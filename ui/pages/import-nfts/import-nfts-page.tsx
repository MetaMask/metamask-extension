import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { Header, Page } from '../../components/multichain/pages/page';
import { ImportNftsForm } from '../../components/multichain/import-nfts-modal/import-nfts-form';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';

/**
 * Full-screen import NFT page.
 */
export const ImportNftsPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(DEFAULT_ROUTE);
  };

  return (
    <Page data-testid="import-nfts-page">
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={() => navigate(-1)}
            data-testid="import-nfts-back-button"
          />
        }
        endAccessory={
          <ButtonIcon
            ariaLabel={t('close')}
            iconName={IconName.Close}
            size={ButtonIconSize.Md}
            onClick={handleClose}
            data-testid="import-nfts-close-button"
          />
        }
        marginBottom={0}
      >
        {t('importNFT')}
      </Header>
      <ImportNftsForm onClose={handleClose} onSuccess={handleClose} />
    </Page>
  );
};

export default ImportNftsPage;
