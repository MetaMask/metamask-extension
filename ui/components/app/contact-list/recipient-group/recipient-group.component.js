import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../../ui/identicon';
import { Tag } from '../../../component-library/tag';
import { ellipsify } from '../../../../pages/send/send.utils';
import { Color } from '../../../../helpers/constants/design-system';
import CheckBox from '../../../ui/check-box';
import { ButtonIcon, IconName } from '../../../component-library';

function addressesEqual(address1, address2) {
  return String(address1).toLowerCase() === String(address2).toLowerCase();
}

function renderTags(tags) {
  if (!tags) {
    return null;
  } else if (tags.includes('allowList')) {
    return (
      <Tag
        label="AllowList"
        labelProps={{ color: 'primary-inverse' }}
        labelSize="bodyXs"
        backgroundColor="success-default"
        boxPadding={3}
      />
    );
  } else if (tags.includes('blockList')) {
    return (
      <Tag
        label="BlockList"
        labelProps={{ color: 'primary-inverse' }}
        labelSize="bodyXs"
        backgroundColor="error-default"
        boxPadding={3}
      />
    );
  }
  return undefined;
}
export default function RecipientGroup({
  label,
  items,
  onSelect,
  handleAccountClick,
  selectedAddress,
  areRecipientsMyAccounts = false,
  selectedAccount,
}) {
  if (!items || !items.length) {
    return null;
  }

  return (
    <div
      className="send__select-recipient-wrapper__group"
      data-testid="recipient-group"
    >
      {label && (
        <div className="send__select-recipient-wrapper__group-label">
          {label}
        </div>
      )}
      {items.map(({ address, name, tags }) => {
        const isSelectedAccount = selectedAccount.has(address);
        return (
          <div
            key={address}
            onClick={() => handleAccountClick(address)}
            className={classnames({
              'send__select-recipient-wrapper__group-item': !addressesEqual(
                address,
                selectedAddress,
              ),
              'send__select-recipient-wrapper__group-item--selected':
                addressesEqual(address, selectedAddress),
            })}
          >
            <CheckBox
              className="choose-account-list__list-check-box"
              checked={isSelectedAccount}
            />
            <Identicon
              address={address}
              diameter={28}
              {...(areRecipientsMyAccounts && {
                customizedFox: 'test-strrubf',
              })}
            />
            <div
              className="send__select-recipient-wrapper__group-item__content"
              data-testid="recipient"
              style={{ marginLeft: '8px' }}
            >
              <div className="send__select-recipient-wrapper__group-item__title">
                {name || ellipsify(address)}
              </div>
              {name && (
                <div className="send__select-recipient-wrapper__group-item__subtitle">
                  {ellipsify(address)}
                </div>
              )}
            </div>
            {renderTags(tags)}
            <ButtonIcon
              iconName={IconName.Edit}
              ariaLabel="edit"
              data-testid="edit"
              onClick={() => onSelect(address, name)}
              color={Color.iconDefault}
              marginLeft={6}
            />
          </div>
        );
      })}
    </div>
  );
}

RecipientGroup.propTypes = {
  label: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  ),
  onSelect: PropTypes.func.isRequired,
  selectedAddress: PropTypes.string,
  selectedAccount: PropTypes.any,
  handleAccountClick: PropTypes.func,
  deleteAccounts: PropTypes.func,
  areRecipientsMyAccounts: PropTypes.bool,
};
