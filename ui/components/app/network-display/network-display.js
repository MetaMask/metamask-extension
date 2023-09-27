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
import { Icon, IconName, IconSize } from '../../component-library';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { getNetworkLabelKey } from '../../../helpers/utils/i18n-helper';

/**
 * @deprecated The `<NetworkDisplay />` component has been deprecated in favor of the new `<PickerNetwork>` component from the component-library.
 * Please update your code to use the new `<PickerNetwork>` component instead, which can be found at ui/components/component-library/picker-network/picker-network.tsx.
 * You can find documentation for the new `PickerNetwork` component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-pickernetwork--docs}
 * If you would like to help with the replacement of the old `NetworkDisplay` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-extension/issues/20485}
 */

export default function NetworkDisplay({
  indicatorSize,
  disabled,
  labelProps,
  targetNetwork,
  onClick,
}) {
  const networkIsLoading = useSelector(isNetworkLoading);
  const providerConfig = useSelector(getProviderConfig);
  const t = useI18nContext();

  const { nickname, type: networkType } = targetNetwork ?? providerConfig;

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
        onClick ? <Icon name={IconName.ArrowDown} size={IconSize.Xs} /> : null
      }
      label={
        networkType === NETWORK_TYPES.RPC
          ? nickname ?? t('privateNetwork')
          : t(getNetworkLabelKey(networkType))
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
