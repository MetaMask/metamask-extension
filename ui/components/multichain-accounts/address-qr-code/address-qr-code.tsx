import React, { useCallback, useContext } from 'react';
import { Page, Header, Content, Footer } from '../../multichain/pages/page';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ButtonIcon, ButtonIconSize, ButtonSecondary, ButtonSecondarySize, IconName, Text } from '../../component-library';
import { ACCOUNT_DETAILS_ROUTE } from '../../../helpers/constants/routes';
import { BackgroundColor, TextVariant } from '../../../helpers/constants/design-system';
import { useHistory } from 'react-router-dom';
import QrCodeView from '../../ui/qr-code-view';
import { useSelector } from 'react-redux';
import { AppSliceState } from '../../../ducks/app/app';
import { getInternalAccountByAddress } from '../../../selectors';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { parseCaipChainId } from '@metamask/utils';
import { getMultichainAccountUrl, getMultichainBlockExplorerUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { openBlockExplorer } from '../../multichain/menu-items/view-explorer-menu-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';

export const AddressQRCode = () => {
  const t = useI18nContext();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const address = useSelector(
    (state: AppSliceState) => state.appState.accountDetailsAddress,
  );
  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );

  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    account,
  );

  const addressLink = getMultichainAccountUrl(
    account.address,
    multichainNetwork,
  );

  const chainId = parseCaipChainId(multichainNetwork.chainId).reference;


  const handleNavigation = useCallback(() => {
    trackEvent({
      event: MetaMetricsEventName.BlockExplorerLinkClicked,
      category: MetaMetricsEventCategory.Accounts,
      properties: {
        location: 'Account Details QR Code Page',
        chain_id: chainId,
      },
    });
    openBlockExplorer(addressLink, 'Account Details QR Code Page', trackEvent);
  }, [history]);


  return (
    <Page>
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() => history.push(ACCOUNT_DETAILS_ROUTE)}
          />
        }
      >
        {t('address')}
      </Header>
      <Content>
        <QrCodeView Qr={{ data: address }} location="Account Details Page" />
      </Content>
      <Footer>
        <ButtonSecondary
          onClick={handleClick}
          size={ButtonSecondarySize.Lg}
          textProps={{
            variant: TextVariant.bodyMdMedium,
          }}
        >
          {t('viewOnExplorer')}
        </ButtonSecondary>
      </Footer>
    </Page>
  );
};