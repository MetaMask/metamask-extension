import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Identicon from '../../ui/identicon'

const AssetListItem = ({
  active,
  children,
  className,
  'data-testid': dataTestId,
  iconClassName,
  menu,
  onClick,
  tokenAddress,
  tokenImage,
  warning,
}) => {
  return (
    <div
      className={classnames('asset-list-item__container', className, {
        'asset-list-item__container--active': active,
      })}
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
      { menu }
    </div>
  )
}

AssetListItem.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  iconClassName: PropTypes.string,
  menu: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  tokenAddress: PropTypes.string,
  tokenImage: PropTypes.string,
  warning: PropTypes.node,
}

AssetListItem.defaultProps = {
  active: undefined,
  className: undefined,
  'data-testid': undefined,
  menu: undefined,
  iconClassName: undefined,
  tokenAddress: undefined,
  tokenImage: undefined,
  warning: undefined,
}

export default AssetListItem
