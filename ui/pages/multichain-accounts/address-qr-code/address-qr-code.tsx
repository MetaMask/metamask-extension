import React, { useCallback, useContext } from 'react';
import { parseCaipChainId } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
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
import { ACCOUNT_DETAILS_ROUTE } from '../../../helpers/constants/routes';
import {
  BackgroundColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import QrCodeView from '../../../components/ui/qr-code-view';
import { AppSliceState } from '../../../ducks/app/app';
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

  const metricsLocation = 'Account Details QR Code Page';

  const handleNavigation = useCallback(() => {
    trackEvent({
      event: MetaMetricsEventName.BlockExplorerLinkClicked,
      category: MetaMetricsEventCategory.Accounts,
      properties: {
        location: metricsLocation,
        chain_id: chainId,
      },
    });
    openBlockExplorer(addressLink, metricsLocation, trackEvent);
  }, [chainId, trackEvent, addressLink]);

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
      <Content paddingTop={0}>
        <QrCodeView Qr={{ data: address }} location="Account Details Page" />
      </Content>
      <Footer>
        <ButtonSecondary
          onClick={handleNavigation}
          size={ButtonSecondarySize.Lg}
          textProps={{
            variant: TextVariant.bodyMdMedium,
          }}
          style={{
            width: '100%',
          }}
        >
          {t('viewOnExplorer')}
        </ButtonSecondary>
      </Footer>
    </Page>
  );
};
