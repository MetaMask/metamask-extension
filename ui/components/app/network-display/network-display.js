import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import {
  NETWORK_TYPES,
  BUILT_IN_NETWORKS,
} from '../../../../shared/constants/network';

import LoadingIndicator from '../../ui/loading-indicator';
import ColorIndicator from '../../ui/color-indicator';
import {
  BorderColor,
  IconColor,
  Size,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import Chip from '../../ui/chip/chip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { isNetworkLoading } from '../../../selectors';
import {
  Icon,
  ICON_NAMES,
  ICON_SIZES,
} from '../../component-library/icon/deprecated';

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

  const { nickname, type: networkType } = targetNetwork ?? currentNetwork;

  return (
    <Chip
      dataTestId="network-display"
      borderColor={
        onClick ? BorderColor.borderDefault : BorderColor.borderMuted
      }
      onClick={onClick}
      leftIcon={
        <LoadingIndicator
          alt={t('attemptingConnect')}
          title={t('attemptingConnect')}
          isLoading={networkIsLoading}
        >
          <ColorIndicator
            color={
              networkType === NETWORK_TYPES.RPC
                ? IconColor.iconMuted
                : networkType
            }
            size={indicatorSize}
            type={ColorIndicator.TYPES.FILLED}
            iconClassName={
              networkType === NETWORK_TYPES.RPC && indicatorSize !== Size.XS
                ? 'fa fa-question'
                : undefined
            }
          />
        </LoadingIndicator>
      }
      rightIcon={
        onClick ? (
          <Icon name={ICON_NAMES.ARROW_DOWN} size={ICON_SIZES.XS} />
        ) : null
      }
      label={
        networkType === NETWORK_TYPES.RPC
          ? nickname ?? t('privateNetwork')
          : t(networkType)
      }
      className={classnames('network-display', {
        'network-display--disabled': disabled,
        'network-display--clickable': typeof onClick === 'function',
      })}
      labelProps={{
        variant: TypographyVariant.H7,
        ...labelProps,
      }}
    />
  );
}
NetworkDisplay.propTypes = {
  /**
   * The size of the indicator
   */
  indicatorSize: PropTypes.oneOf(Object.values(Size)),
  /**
   * The label props of the label can use most of the Typography props
   */
  labelProps: Chip.propTypes.labelProps,
  /**
   * The target network
   */
  targetNetwork: PropTypes.shape({
    type: PropTypes.oneOf([
      ...Object.keys(BUILT_IN_NETWORKS),
      NETWORK_TYPES.RPC,
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
  indicatorSize: Size.LG,
};
