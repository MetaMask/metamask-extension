import React from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../ui/identicon'
import { ellipsify } from '../../../../pages/send/send.utils'

export default function RecipientGroup ({ label, items, onSelect }) {
  if (!items || !items.length) {
    return null
  }

  return (
    <div className="send__select-recipient-wrapper__group">
      <div className="send__select-recipient-wrapper__group-label">
        {label}
      </div>
      {
        items.map(({ address, name }) => (
          <div
            key={address}
            className="send__select-recipient-wrapper__group-item"
            onClick={() => onSelect(address, name)}
          >
            <Identicon address={address} diameter={28} />
            <div className="send__select-recipient-wrapper__group-item__content">
              <div className="send__select-recipient-wrapper__group-item__title">
                {name || ellipsify(address)}
              </div>
              {
                name && (
                  <div className="send__select-recipient-wrapper__group-item__subtitle">
                    {ellipsify(address)}
                  </div>
                )
              }
            </div>
          </div>
        ))
      }
    </div>
  )
}

RecipientGroup.propTypes = {
  label: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    address: PropTypes.string,
    name: PropTypes.string,
  })),
  onSelect: PropTypes.func.isRequired,
}
