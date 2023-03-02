import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getBlockExplorerLinkText } from '../../../selectors';
import { Menu, MenuItem } from '../../ui/menu';
import { ICON_NAMES } from '../../component-library';
import { EVENT_NAMES, EVENT } from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { showModal } from '../../../store/actions';

export const AccountListItemMenu = ({ anchorElement, blockExplorerUrlSubTitle, onClose, isRemovable, identity }) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  const blockExplorerLinkText = useSelector(getBlockExplorerLinkText);
  const openBlockExplorer = () => {
    trackEvent({
      event: EVENT_NAMES.EXTERNAL_LINK_CLICKED,
      category: EVENT.CATEGORIES.NAVIGATION,
      properties: {
        link_type: EVENT.EXTERNAL_LINK_TYPES.ACCOUNT_TRACKER,
        location: 'Account Options',
        url_domain: getURLHostName(addressLink),
      },
    });
    global.platform.openTab({
      url: addressLink,
    });
    onClose();
  };

  return (
    <Menu
      anchorElement={anchorElement}
      className="account-list-item-menu"
      onHide={onClose}
    >
      <MenuItem
        onClick={
          blockExplorerLinkText.firstPart === 'addBlockExplorer'
          ? routeToAddBlockExplorerUrl
          : openBlockExplorer
        }
        subtitle={
          blockExplorerUrlSubTitle ? (blockExplorerUrlSubTitle) : null
        }
        iconName={ICON_NAMES.EXPORT}
      >
        {t(
          blockExplorerLinkText.firstPart,
          blockExplorerLinkText.secondPart === ''
            ? null
            : [t(blockExplorerLinkText.secondPart)],
        )}
      </MenuItem>
      <MenuItem
        onClick={() => {
          dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
          trackEvent({
            event: EVENT_NAMES.NAV_ACCOUNT_DETAILS_OPENED,
            category: EVENT.CATEGORIES.NAVIGATION,
            properties: {
              location: 'Account Options',
            },
          });
          onClose();
        }}
        iconName={ICON_NAMES.SCAN_BARCODE}
      >
        {t('accountDetails')}
      </MenuItem>
      {isRemovable ? (
        <MenuItem
          onClick={() => {
            dispatch(
              showModal({
                name: 'CONFIRM_REMOVE_ACCOUNT',
                identity: selectedIdentity,
              }),
            );
            onClose();
          }}
          iconName={ICON_NAMES.TRASH}
        >
          {t('removeAccount')}
        </MenuItem>
      ) : null}
    </Menu>
  );
};

AccountListItemMenu.propTypes = {
  anchorElement: PropTypes.instanceOf(window.Element),
  onClose: PropTypes.func.required,
}