import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_CONNECTED_TO_SNAP,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
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
  BadgeWrapper,
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../component-library';
import {
  getOriginOfCurrentTab,
  getSelectedInternalAccount,
  getSubjectMetadata,
} from '../../../selectors';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const ConnectedSiteMenu = ({
  className,
  globalMenuColor,
  status,
  text,
  onClick,
  disabled,
}) => {
  const t = useI18nContext();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const subjectMetadata = useSelector(getSubjectMetadata);
  const connectedOrigin = useSelector(getOriginOfCurrentTab);
  const connectedSubjectsMetadata = subjectMetadata[connectedOrigin];
  const isConnectedtoOtherAccountOrSnap =
    status === STATUS_CONNECTED_TO_ANOTHER_ACCOUNT ||
    status === STATUS_CONNECTED_TO_SNAP;
  return (
    <Box
      className={classNames(
        `multichain-connected-site-menu${disabled ? '--disabled' : ''}`,
        className,
      )}
      data-testid="connection-menu"
      as="button"
      onClick={onClick}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      <Tooltip
        title={
          status === STATUS_NOT_CONNECTED
            ? t('statusNotConnectedAccount')
            : `${selectedAccount?.metadata.name} ${text}`
        }
        data-testid="multichain-connected-site-menu__tooltip"
        position="bottom"
      >
        <BadgeWrapper
          positionObj={
            isConnectedtoOtherAccountOrSnap
              ? { bottom: -1, right: -2, zIndex: 1 }
              : { bottom: -1, right: -4, zIndex: 1 }
          }
          badge={
            <Box
              backgroundColor={globalMenuColor}
              className={classNames('multichain-connected-site-menu__badge', {
                'not-connected': isConnectedtoOtherAccountOrSnap,
              })}
              borderRadius={BorderRadius.full}
              borderColor={
                isConnectedtoOtherAccountOrSnap
                  ? BorderColor.successDefault
                  : BorderColor.backgroundDefault
              }
              borderWidth={2}
            />
          }
        >
          {connectedSubjectsMetadata?.iconUrl ? (
            <AvatarFavicon
              name={connectedSubjectsMetadata.name}
              size={Size.SM}
              src={connectedSubjectsMetadata.iconUrl}
            />
          ) : (
            <Icon
              name={IconName.Global}
              size={IconSize.Sm}
              color={IconColor.iconDefault}
            />
          )}
        </BadgeWrapper>
      </Tooltip>
    </Box>
  );
};

ConnectedSiteMenu.propTypes = {
  /**
   * Additional classNames to be added to the ConnectedSiteMenu
   */
  className: PropTypes.string,
  /**
   * Background color based on the connection status
   */
  globalMenuColor: PropTypes.string.isRequired,
  /**
   * Connection status string
   */
  status: PropTypes.string.isRequired,
  /**
   * Connection status message
   */
  text: PropTypes.string,
  /**
   * onClick handler to be passed
   */
  onClick: PropTypes.func,
  /**
   *  Disable the connected site menu if the account is non-evm
   */
  disabled: PropTypes.bool,
};
