import React, { useCallback, useContext } from 'react';
import { parseCaipChainId } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import {
  Page,
  Header,
  Content,
  Footer,
} from '../../../components/multichain/pages/page';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
} from '../../../components/component-library';
import {
  BackgroundColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import QrCodeView from '../../../components/ui/qr-code-view';
import { getInternalAccountByAddress } from '../../../selectors';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainAccountUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { openBlockExplorer } from '../../../components/multichain/menu-items/view-explorer-menu-item';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { getAccountTypeCategory } from '../account-details';

export const AddressQRCode = () => {
  const t = useI18nContext();
  const history = useHistory();
  const { address } = useParams();
  const trackEvent = useContext(MetaMetricsContext);
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

  const metricsLocation = 'Account Details QR Code Page';

  const handleNavigation = useCallback(() => {
    trackEvent({
      event: MetaMetricsEventName.BlockExplorerLinkClicked,
      category: MetaMetricsEventCategory.Accounts,
      properties: {
        location: metricsLocation,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: chainId,
      },
    });
    openBlockExplorer(addressLink, metricsLocation, trackEvent);
  }, [chainId, trackEvent, addressLink]);

  const getExplorerButtonText = (): string => {
    switch (getAccountTypeCategory(account)) {
      case 'evm':
        return t('viewAddressOnExplorer', ['Etherscan']);
      case 'solana':
        return t('viewAddressOnExplorer', ['Solscan']);
      default:
        return t('viewOnExplorer');
    }
  };

  return (
    <Page className="address-qr-code-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() => history.goBack()}
          />
        }
      >
        {t('address')}
      </Header>
      <Content paddingTop={0}>
        <QrCodeView
          Qr={{ data: address as string }}
          location="Account Details Page"
          accountName={account.metadata.name}
        />
      </Content>
      <Footer>
        <ButtonSecondary
          onClick={handleNavigation}
          size={ButtonSecondarySize.Lg}
          data-testid={addressLink}
          textProps={{
            variant: TextVariant.bodyMdMedium,
          }}
          style={{
            width: '100%',
          }}
        >
          {getExplorerButtonText()}
        </ButtonSecondary>
      </Footer>
    </Page>
  );
};
