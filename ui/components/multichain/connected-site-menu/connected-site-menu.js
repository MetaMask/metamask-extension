import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
  Size,
} from '../../../helpers/constants/design-system';
import {
  AvatarFavicon,
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
import { ConnectedSitePopover } from '../connected-site-popover';

export const ConnectedSiteMenu = ({ className, disabled, onClick }) => {
  const [showPopover, setShowPopover] = useState(false);

  const referenceElement = useRef(null);

  const subjectMetadata = useSelector(getSubjectMetadata);
  const connectedOrigin = useSelector(getOriginOfCurrentTab);
  const permittedAccountsByOrigin = useSelector(getPermittedAccountsByOrigin);
  const currentTabHasNoAccounts =
    !permittedAccountsByOrigin[connectedOrigin]?.length;
  const connectedSubjectsMetadata = subjectMetadata[connectedOrigin];

  const iconElement = currentTabHasNoAccounts ? (
    <Icon
      name={IconName.Global}
      size={IconSize.Sm}
      color={IconColor.iconDefault}
    />
  ) : (
    <AvatarFavicon
      name={connectedSubjectsMetadata.name}
      size={Size.SM}
      src={connectedSubjectsMetadata.iconUrl}
    />
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
          isConnected={!currentTabHasNoAccounts}
          onClick={onClick}
          onClose={() => setShowPopover(false)}
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
};
