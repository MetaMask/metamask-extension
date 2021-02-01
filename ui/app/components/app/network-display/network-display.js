import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { useSelector } from 'react-redux'
import { NETWORK_TYPE_RPC } from '../../../../../shared/constants/network'

import LoadingIndicator from '../../ui/loading-indicator'
import ColorIndicator from '../../ui/color-indicator'
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system'
import Chip from '../../ui/chip/chip'
import { useI18nContext } from '../../../hooks/useI18nContext'

export default function NetworkDisplay({
  colored,
  outline,
  iconClassName,
  disabled,
  onClick,
}) {
  const { network, networkNickname, networkType } = useSelector((state) => ({
    network: state.metamask.network,
    networkNickname: state.metamask.provider.nickname,
    networkType: state.metamask.provider.type,
  }))
  const t = useI18nContext()

  return (
    <Chip
      borderColor={outline ? COLORS.UI3 : COLORS.TRANSPARENT}
      onClick={onClick}
      leftIcon={
        <LoadingIndicator
          alt={t('attemptingConnect')}
          title={t('attemptingConnect')}
          isLoading={network === 'loading'}
        >
          <ColorIndicator
            color={networkType === NETWORK_TYPE_RPC ? COLORS.UI4 : networkType}
            size={ColorIndicator.SIZES.LARGE}
            type={ColorIndicator.TYPES.FILLED}
            iconClassName={
              networkType === NETWORK_TYPE_RPC ? 'fa fa-question' : undefined
            }
          />
        </LoadingIndicator>
      }
      rightIcon={
        iconClassName && (
          <i className={classnames('network-display__icon', iconClassName)} />
        )
      }
      label={
        networkType === NETWORK_TYPE_RPC
          ? networkNickname ?? t('privateNetwork')
          : t(networkType)
      }
      className={classnames('network-display', {
        'network-display--colored': colored,
        'network-display--disabled': disabled,
        [`network-display--${networkType}`]: colored && networkType,
      })}
      labelProps={{
        variant: TYPOGRAPHY.H7,
      }}
    />
  )
}
NetworkDisplay.propTypes = {
  colored: PropTypes.bool,
  outline: PropTypes.bool,
  disabled: PropTypes.bool,
  iconClassName: PropTypes.string,
  onClick: PropTypes.func,
}

NetworkDisplay.defaultProps = {
  colored: true,
}
