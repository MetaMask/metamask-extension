import React from 'react';
import PropTypes from 'prop-types';
import { AddressListItem } from '../../../multichain';

export default function RecipientGroup({ items, onSelect }) {
  if (!items || !items.length) {
    return null;
  }

  return items.map(({ address, name, isDuplicate, chainId }) => (
    <AddressListItem
      address={address}
      label={name}
      onClick={() => onSelect(address, name, chainId)}
      key={address}
      chainId={chainId}
      isDuplicate={isDuplicate}
    />
  ));
}

RecipientGroup.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      address: PropTypes.string.isRequired,
      name: PropTypes.string,
    }),
  ),
  onSelect: PropTypes.func.isRequired,
};
