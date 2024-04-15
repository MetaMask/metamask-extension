import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../../ui/identicon';
import { ellipsify } from '../../../../pages/confirmations/send/send.utils';
import Box from '../../../ui/box';
import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../component-library';
import { AddressListItem } from '../../../multichain';

function addressesEqual(address1, address2) {
  return String(address1).toLowerCase() === String(address2).toLowerCase();
}

export default function RecipientGroup({
  label,
  items,
  onSelect,
  selectedAddress,
}) {
  if (!items || !items.length) {
    return null;
  }

  if (process.env.MULTICHAIN) {
    return items.map(({ address, name }) => (
      <AddressListItem
        address={address}
        label={name}
        onClick={() => onSelect(address, name)}
        key={address}
      />
    ));
  }

  return (
    <Box
      className="send__select-recipient-wrapper__group"
      data-testid="recipient-group"
    >
      {label && (
        <Box
          className="send__select-recipient-wrapper__group-label"
          marginTop={2}
          marginBottom={2}
          marginLeft={4}
          marginRight={4}
        >
          <Text variant={TextVariant.bodyMd}>{label}</Text>
        </Box>
      )}
      {items.map(({ address, name }) => (
        <Box
          key={address}
          onClick={() => onSelect(address, name)}
          className={classnames({
            'send__select-recipient-wrapper__group-item': !addressesEqual(
              address,
              selectedAddress,
            ),
            'send__select-recipient-wrapper__group-item--selected':
              addressesEqual(address, selectedAddress),
          })}
          padding={4}
        >
          <Identicon address={address} diameter={28} />
          <Box
            className="send__select-recipient-wrapper__group-item__content"
            data-testid="recipient"
          >
            <Text
              variant={TextVariant.bodyLgMedium}
              className="send__select-recipient-wrapper__group-item__title"
            >
              {name || ellipsify(address)}
            </Text>
            {name && (
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
                className="send__select-recipient-wrapper__group-item__subtitle"
              >
                {ellipsify(address)}
              </Text>
            )}
          </Box>
        </Box>
      ))}
    </Box>
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
};
