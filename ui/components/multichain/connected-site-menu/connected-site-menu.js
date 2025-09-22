import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  Size,
} from '../../../helpers/constants/design-system';
import {
  AvatarFavicon,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../component-library';
import {
  getOriginOfCurrentTab,
  getPermittedAccountsByOrigin,
  getSubjectMetadata,
} from '../../../selectors';
import { getDappActiveNetwork } from '../../../selectors/dapp';
import { ConnectedSitePopover } from '../connected-site-popover';
import { STATUS_CONNECTED } from '../../../helpers/constants/connected-sites';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';

export const ConnectedSiteMenu = ({ className, disabled, onClick, status }) => {
  const [showPopover, setShowPopover] = useState(false);

  const referenceElement = useRef(null);

  const subjectMetadata = useSelector(getSubjectMetadata);
  const connectedOrigin = useSelector(getOriginOfCurrentTab);
  const permittedAccountsByOrigin = useSelector(getPermittedAccountsByOrigin);
  const dappActiveNetwork = useSelector(getDappActiveNetwork);
  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[connectedOrigin]?.length;
  const connectedSubjectsMetadata = subjectMetadata[connectedOrigin];

  // Get network image URL for the badge
  const getNetworkImageSrc = () => {
    if (dappActiveNetwork?.chainId) {
      return CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[dappActiveNetwork.chainId];
    }
    return undefined;
  };

  const iconElement = currentTabHasNoAccounts ? (
    <Icon
      name={IconName.Global}
      size={IconSize.Lg}
      color={IconColor.iconDefault}
    />
  ) : (
    <BadgeWrapper
      badge={
        dappActiveNetwork && (
          <AvatarNetwork
            size={AvatarNetworkSize.Xs}
            name={dappActiveNetwork.name || dappActiveNetwork.nickname}
            src={getNetworkImageSrc()}
            backgroundColor={BackgroundColor.backgroundSection}
            borderWidth={2}
            borderColor={BorderColor.backgroundDefault}
          />
        )
      }
    >
      <AvatarFavicon
        name={connectedSubjectsMetadata?.name}
        size={Size.SM}
        src={connectedSubjectsMetadata?.iconUrl}
      />
    </BadgeWrapper>
  );
  return (
    <>
      <Box
        className={classNames(
          `multichain-connected-site-menu${disabled ? '--disabled' : ''}`,
          className,
        )}
        data-testid="connection-menu"
        as="button"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundDefault}
        ref={referenceElement}
        onClick={() => setShowPopover(true)}
        borderRadius={BorderRadius.LG}
      >
        <>{iconElement}</>
      </Box>
      {showPopover && (
        <ConnectedSitePopover
          referenceElement={referenceElement}
          isOpen={showPopover}
          isConnected={status === STATUS_CONNECTED}
          onClick={onClick}
          onClose={() => setShowPopover(false)}
          connectedOrigin={connectedOrigin}
        />
      )}
    </>
  );
};

ConnectedSiteMenu.propTypes = {
  /**
   * Additional classNames to be added to the ConnectedSiteMenu
   */
  className: PropTypes.string,
  /**
   * onClick handler to be passed
   */
  onClick: PropTypes.func,
  /**
   *  Disable the connected site menu if the account is non-evm
   */
  disabled: PropTypes.bool,
  /**
   * The status of the connected site menu
   */
  status: PropTypes.string,
};
