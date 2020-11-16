import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'

import { I18nContext } from '../../../contexts/i18n'
import { Menu, MenuItem } from '../../../components/ui/menu'

const TokenOptions = ({ onRemove, onViewEtherscan, tokenSymbol }) => {
  const t = useContext(I18nContext)
  const [tokenOptionsButtonElement, setTokenOptionsButtonElement] = useState(
    null,
  )
  const [tokenOptionsOpen, setTokenOptionsOpen] = useState(false)

  return (
    <>
      <button
        className="fas fa-ellipsis-v token-options__button"
        data-testid="token-options__button"
        onClick={() => setTokenOptionsOpen(true)}
        ref={setTokenOptionsButtonElement}
        title={t('tokenOptions')}
      />
      {tokenOptionsOpen ? (
        <Menu
          anchorElement={tokenOptionsButtonElement}
          onHide={() => setTokenOptionsOpen(false)}
        >
          <MenuItem
            iconClassName="fas fa-external-link-alt token-options__icon"
            data-testid="token-options__etherscan"
            onClick={() => {
              setTokenOptionsOpen(false)
              onViewEtherscan()
            }}
          >
            {t('viewOnEtherscan')}
          </MenuItem>
          <MenuItem
            iconClassName="fas fa-trash-alt token-options__icon"
            data-testid="token-options__hide"
            onClick={() => {
              setTokenOptionsOpen(false)
              onRemove()
            }}
          >
            {t('hideTokenSymbol', [tokenSymbol])}
          </MenuItem>
        </Menu>
      ) : null}
    </>
  )
}

TokenOptions.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onViewEtherscan: PropTypes.func.isRequired,
  tokenSymbol: PropTypes.string.isRequired,
}

export default TokenOptions
