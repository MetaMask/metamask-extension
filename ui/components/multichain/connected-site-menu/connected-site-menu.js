import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { parseCaipChainId } from '@metamask/utils';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  Size,
  BorderColor,
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
  getDappActiveNetwork,
} from '../../../selectors';
import { getImageForChainId } from '../../../selectors/multichain';
import { ConnectedSitePopover } from '../connected-site-popover';
import { STATUS_CONNECTED } from '../../../helpers/constants/connected-sites';

export const ConnectedSiteMenu = ({ className, disabled, onClick, status }) => {
  const [showPopover, setShowPopover] = useState(false);

  const referenceElement = useRef(null);

  const subjectMetadata = useSelector(getSubjectMetadata);
  const connectedOrigin = useSelector(getOriginOfCurrentTab);
  const permittedAccountsByOrigin = useSelector(getPermittedAccountsByOrigin);
  const dappActiveNetwork = useSelector((state) =>
    getDappActiveNetwork(state, connectedOrigin),
  );

  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[connectedOrigin]?.length;
  const connectedSubjectsMetadata = subjectMetadata[connectedOrigin];
  const getChainIdForImage = (chainId) => {
    const { namespace, reference } = parseCaipChainId(chainId);
    return namespace === 'eip155'
      ? `0x${parseInt(reference, 10).toString(16)}`
      : chainId;
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
            name={dappActiveNetwork?.name || ''}
            src={
              dappActiveNetwork?.chainId?.includes(':')
                ? getImageForChainId(
                    getChainIdForImage(dappActiveNetwork.chainId),
                  )
                : getImageForChainId(dappActiveNetwork?.chainId)
            }
            borderColor={BorderColor.borderMuted}
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
