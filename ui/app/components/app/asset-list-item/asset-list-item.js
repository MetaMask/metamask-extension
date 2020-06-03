import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Identicon from '../../ui/identicon'
import ListItem from '../../ui/list-item'

const AssetListItem = ({
  className,
  'data-testid': dataTestId,
  iconClassName,
  onClick,
  tokenAddress,
  tokenImage,
  warning,
  primary,
  secondary,
}) => {
  return (
    <ListItem
      className={classnames('asset-list-item', className)}
      data-testid={dataTestId}
      title={primary}
      titleIcon={warning}
      subtitle={secondary}
      onClick={onClick}
      icon={(
        <Identicon
          className={iconClassName}
          diameter={32}
          address={tokenAddress}
          image={tokenImage}
        />
      )}
      rightContent={<i className="fas fa-chevron-right asset-list-item__chevron-right" />}
    />
  )
}

AssetListItem.propTypes = {
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  iconClassName: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  tokenAddress: PropTypes.string,
  tokenImage: PropTypes.string,
  warning: PropTypes.node,
  primary: PropTypes.string,
  secondary: PropTypes.string,
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
