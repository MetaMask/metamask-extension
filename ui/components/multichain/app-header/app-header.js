import React, { useCallback, useContext, useRef } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath } from 'react-router-dom';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  CONFIRM_TRANSACTION_ROUTE,
  SWAPS_ROUTE,
} from '../../../helpers/constants/routes';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';
import { getUnapprovedTransactions } from '../../../selectors';

import { toggleNetworkMenu } from '../../../store/actions';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getIsUnlocked } from '../../../ducks/metamask/metamask';
import { SEND_STAGES, getSendStage } from '../../../ducks/send';
import { getSelectedMultichainNetworkConfiguration } from '../../../selectors/multichain/networks';
import { getNetworkIcon } from '../../../../shared/modules/network.utils';
import { MultichainMetaFoxLogo } from './multichain-meta-fox-logo';
import { AppHeaderContainer } from './app-header-container';
import { AppHeaderUnlockedContent } from './app-header-unlocked-content';
import { AppHeaderLockedContent } from './app-header-locked-content';

export const AppHeader = ({ location }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const menuRef = useRef(null);
  const isUnlocked = useSelector(getIsUnlocked);

  const multichainNetwork = useSelector(
    getSelectedMultichainNetworkConfiguration,
  );

  const { chainId, isEvm } = multichainNetwork;
  const networkIconSrc = getNetworkIcon(chainId, isEvm);

  const dispatch = useDispatch();

  const popupStatus = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  // Disable the network and account pickers if the user is in
  // a critical flow
  const sendStage = useSelector(getSendStage);
  const isTransactionEditPage = [
    SEND_STAGES.EDIT,
    SEND_STAGES.DRAFT,
    SEND_STAGES.ADD_RECIPIENT,
  ].includes(sendStage);
  const isConfirmationPage = Boolean(
    matchPath(location.pathname, {
      path: CONFIRM_TRANSACTION_ROUTE,
      exact: false,
    }),
  );
  const isSwapsPage = Boolean(
    matchPath(location.pathname, { path: SWAPS_ROUTE, exact: false }),
  );

  const unapprovedTransactions = useSelector(getUnapprovedTransactions);

  const hasUnapprovedTransactions =
    Object.keys(unapprovedTransactions).length > 0;

  const disableAccountPicker = isConfirmationPage || isSwapsPage;

  const disableNetworkPicker =
    isSwapsPage ||
    isTransactionEditPage ||
    isConfirmationPage ||
    hasUnapprovedTransactions;

  // Callback for network dropdown
  const networkOpenCallback = useCallback(() => {
    dispatch(toggleNetworkMenu());
    trackEvent({
      event: MetaMetricsEventName.NavNetworkMenuOpened,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: 'App header',
        chain_id: chainId,
      },
    });
  }, [chainId, dispatch, trackEvent]);

  const unlockedStyling = {
    alignItems: AlignItems.center,
    width: BlockSize.Full,
    backgroundColor: BackgroundColor.backgroundDefault,
    padding: 2,
    paddingLeft: 4,
    paddingRight: 4,
    gap: 2,
  };

  const lockStyling = {
    display: Display.Flex,
    alignItems: AlignItems.center,
    width: BlockSize.Full,
    justifyContent: JustifyContent.spaceBetween,
    backgroundColor: BackgroundColor.backgroundDefault,
    padding: 2,
    gap: 2,
  };

  return (
    <>
      {isUnlocked && !popupStatus ? <MultichainMetaFoxLogo /> : null}
      <AppHeaderContainer isUnlocked={isUnlocked} popupStatus={popupStatus}>
        <>
          <Box
            className={classnames(
              isUnlocked
                ? 'multichain-app-header__contents flex'
                : 'multichain-app-header__lock-contents',
            )}
            {...(isUnlocked ? unlockedStyling : lockStyling)}
          >
            {isUnlocked ? (
              <AppHeaderUnlockedContent
                popupStatus={popupStatus}
                currentNetwork={multichainNetwork}
                networkIconSrc={networkIconSrc}
                networkOpenCallback={networkOpenCallback}
                disableNetworkPicker={disableNetworkPicker}
                disableAccountPicker={disableAccountPicker}
                menuRef={menuRef}
              />
            ) : (
              <AppHeaderLockedContent
                currentNetwork={multichainNetwork}
                networkIconSrc={networkIconSrc}
                networkOpenCallback={networkOpenCallback}
              />
            )}
          </Box>
        </>
      </AppHeaderContainer>
    </>
  );
};

AppHeader.propTypes = {
  /**
   * The location object for the application
   */
  location: PropTypes.object,
};
