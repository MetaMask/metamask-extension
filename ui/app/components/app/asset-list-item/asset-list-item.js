import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Identicon from '../../ui/identicon'

const AssetListItem = ({
  children,
  className,
  'data-testid': dataTestId,
  iconClassName,
  onClick,
  tokenAddress,
  tokenImage,
  warning,
}) => {
  return (
    <div
      className={classnames('asset-list-item__container', className)}
      data-testid={dataTestId}
      onClick={onClick}
    >
      <Identicon
        className={iconClassName}
        diameter={32}
        address={tokenAddress}
        image={tokenImage}
      />
      <div
        className="asset-list-item__balance"
      >
        { children }
      </div>
      { warning }
      <i className="fas fa-chevron-right asset-list-item__chevron-right" />
    </div>
  )
}

AssetListItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  iconClassName: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  tokenAddress: PropTypes.string,
  tokenImage: PropTypes.string,
  warning: PropTypes.node,
}

AssetListItem.defaultProps = {
  className: undefined,
  'data-testid': undefined,
  iconClassName: undefined,
  tokenAddress: undefined,
  tokenImage: undefined,
  warning: undefined,
}

export default AssetListItem
