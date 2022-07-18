import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import {
  NETWORK_TYPE_RPC,
  NETWORK_TYPE_TO_ID_MAP,
} from '../../../../shared/constants/network';

import LoadingIndicator from '../../ui/loading-indicator';
import ColorIndicator from '../../ui/color-indicator';
import {
  COLORS,
  SIZES,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import Chip from '../../ui/chip/chip';
import IconCaretDown from '../../ui/icon/icon-caret-down';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isNetworkLoading } from '../../../selectors';

export default function NetworkDisplay({
  indicatorSize,
  disabled,
  labelProps,
  targetNetwork,
  onClick,
}) {
  const networkIsLoading = useSelector(isNetworkLoading);
  const currentNetwork = useSelector((state) => ({
    nickname: state.metamask.provider.nickname,
    type: state.metamask.provider.type,
  }));
  const t = useI18nContext();

  const { nickname: networkNickname, type: networkType } =
    targetNetwork ?? currentNetwork;

  return (
    <Chip
      borderColor={onClick ? COLORS.BORDER_DEFAULT : COLORS.BORDER_MUTED}
      onClick={onClick}
      leftIcon={
        <LoadingIndicator
          alt={t('attemptingConnect')}
          title={t('attemptingConnect')}
          isLoading={networkIsLoading}
        >
          <ColorIndicator
            color={
              networkType === NETWORK_TYPE_RPC ? COLORS.ICON_MUTED : networkType
            }
            size={indicatorSize}
            type={ColorIndicator.TYPES.FILLED}
            iconClassName={
              networkType === NETWORK_TYPE_RPC && indicatorSize !== SIZES.XS
                ? 'fa fa-question'
                : undefined
            }
          />
        </LoadingIndicator>
      }
      rightIcon={
        onClick ? (
          <IconCaretDown size={16} className="network-display__icon" />
        ) : null
      }
      label={
        networkType === NETWORK_TYPE_RPC
          ? networkNickname ?? t('privateNetwork')
          : t(networkType)
      }
      className={classnames('network-display', {
        'network-display--disabled': disabled,
        'network-display--clickable': typeof onClick === 'function',
      })}
      labelProps={{
        variant: TYPOGRAPHY.H7,
        ...labelProps,
      }}
    />
  );
}
NetworkDisplay.propTypes = {
  /**
   * The size of the indicator
   */
  indicatorSize: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The label props of the label can use most of the Typography props
   */
  labelProps: Chip.propTypes.labelProps,
  /**
   * The target network
   */
  targetNetwork: PropTypes.shape({
    type: PropTypes.oneOf([
      ...Object.keys(NETWORK_TYPE_TO_ID_MAP),
      NETWORK_TYPE_RPC,
    ]),
    nickname: PropTypes.string,
  }),
  /**
   * Whether the NetworkDisplay is disabled
   */
  disabled: PropTypes.bool,
  /**
   * The onClick event handler of the NetworkDisplay
   * if it is not passed it is assumed that the NetworkDisplay
   * should not be interactive and removes the caret and changes the border color
   * of the NetworkDisplay
   */
  onClick: PropTypes.func,
};

NetworkDisplay.defaultProps = {
  indicatorSize: SIZES.LG,
};
