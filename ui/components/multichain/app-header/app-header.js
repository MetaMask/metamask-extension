import React, { useCallback, useRef } from 'react';
import classnames from 'clsx';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { matchPath } from 'react-router-dom';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../../helpers/constants/routes';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';

import { toggleNetworkMenu } from '../../../store/actions';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { getSelectedMultichainNetworkConfiguration } from '../../../selectors/multichain/networks';
import { useDispatch } from '../../../store/hooks';
import { MultichainMetaFoxLogo } from './multichain-meta-fox-logo';
import { AppHeaderContainer } from './app-header-container';
import { AppHeaderUnlockedContent } from './app-header-unlocked-content';
import { AppHeaderLockedContent } from './app-header-locked-content';

export const AppHeader = ({ location }) => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const menuRef = useRef(null);
  const isUnlocked = useSelector(getIsUnlocked);

  const multichainNetwork = useSelector(
    getSelectedMultichainNetworkConfiguration,
  );

  const { chainId } = multichainNetwork;

  const dispatch = useDispatch();

  const environmentType = getEnvironmentType();
  const popupStatus = environmentType === ENVIRONMENT_TYPE_POPUP;
  const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

  // Disable the account picker if the user is in a critical flow
  const isConfirmationPage = Boolean(
    matchPath(
      {
        path: CONFIRM_TRANSACTION_ROUTE,
        end: false,
      },
      location?.pathname || '',
    ),
  );
  const isSwapsPage = Boolean(
    matchPath(
      { path: CROSS_CHAIN_SWAP_ROUTE, end: false },
      location?.pathname || '',
    ),
  );

  const disableAccountPicker = isConfirmationPage || isSwapsPage;

  // Callback for network dropdown
  const networkOpenCallback = useCallback(() => {
    dispatch(toggleNetworkMenu());
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NavNetworkMenuOpened)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: 'App header',
          chain_id: chainId,
        })
        .build(),
    );
  }, [chainId, dispatch, trackEvent, createEventBuilder]);

  const unlockedStyling = {
    alignItems: AlignItems.center,
    width: BlockSize.Full,
    backgroundColor: BackgroundColor.backgroundDefault,
    padding: 2,
    paddingLeft: 2,
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
      {isUnlocked && !popupStatus && !isSidepanel && true ? (
        <MultichainMetaFoxLogo />
      ) : null}
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
                disableAccountPicker={disableAccountPicker}
                menuRef={menuRef}
              />
            ) : (
              <AppHeaderLockedContent
                currentNetwork={multichainNetwork}
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
