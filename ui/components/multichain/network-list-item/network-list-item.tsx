import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { CaipChainId } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  AvatarIcon,
  AvatarIconSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Tooltip from '../../ui/tooltip/tooltip';
import { NetworkListItemMenu } from '../network-list-item-menu';
import { getGasFeesSponsoredNetworkEnabled } from '../../../selectors';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';

const isIconSrc = (iconSrc?: string | IconName): iconSrc is IconName => {
  if (!iconSrc) {
    return false;
  }
  // If it's not a string, it can't be an IconName
  if (typeof iconSrc !== 'string') {
    return false;
  }
  // If it's a URL (starts with http://, https://, or data:), it's not an IconName
  if (
    iconSrc.startsWith('http://') ||
    iconSrc.startsWith('https://') ||
    iconSrc.startsWith('data:')
  ) {
    return false;
  }
  // If it contains a file path separator or file extension, it's an image path, not an IconName
  if (
    iconSrc.includes('/') ||
    iconSrc.includes('\\') ||
    iconSrc.includes('.')
  ) {
    return false;
  }
  // Check if it's a known IconName by checking if it exists as a property
  // This is a safe check that won't cause runtime errors
  try {
    return iconSrc in IconName;
  } catch {
    // Fallback: if it's a simple PascalCase identifier, assume it might be an IconName
    // The AvatarIcon component will handle validation
    return /^[A-Z][a-zA-Z0-9]*$/u.test(iconSrc);
  }
};

// TODO: Consider increasing this. This tooltip is
// rendering when it has enough room to see everything
const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 20;

export const NetworkListItem = ({
  name,
  iconSrc,
  iconSize = AvatarNetworkSize.Md,
  iconColor,
  rpcEndpoint,
  chainId,
  selected = false,
  focus = true,
  onClick,
  onDeleteClick,
  onEditClick,
  onDiscoverClick,
  onRpcEndpointClick,
  startAccessory,
  endAccessory,
  showEndAccessory = true,
  disabled = false,
  variant,
  notSelectable = false,
}: {
  name: string;
  iconSrc?: string | IconName;
  iconSize?: AvatarNetworkSize | AvatarIconSize;
  iconColor?: IconColor | TextColor;
  rpcEndpoint?: { name?: string; url: string };
  chainId?: string;
  selected?: boolean;
  onClick: () => void;
  onRpcEndpointClick?: () => void;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  onDiscoverClick?: () => void;
  focus?: boolean;
  startAccessory?: ReactNode;
  endAccessory?: ReactNode;
  showEndAccessory?: boolean;
  disabled?: boolean;
  variant?: TextVariant;
  notSelectable?: boolean;
}) => {
  const t = useI18nContext();
  const networkRef = useRef<HTMLDivElement>(null);

  const [networkListItemMenuElement, setNetworkListItemMenuElement] =
    useState();

  // I can't find a type that satisfies this.

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setNetworkListItemMenuRef = (ref: any) => {
    setNetworkListItemMenuElement(ref);
  };
  const [networkOptionsMenuOpen, setNetworkOptionsMenuOpen] = useState(false);

  // This selector provides the indication if the "Gas sponsored" label
  // is enabled based on the remote feature flag.
  const isGasFeesSponsoredNetworkEnabled = useSelector(
    getGasFeesSponsoredNetworkEnabled,
  );

  // Check if a network has gas sponsorship enabled
  const isNetworkGasSponsored = useCallback(
    (networkChainId: string | undefined): boolean => {
      if (!networkChainId) {
        return false;
      }

      // Convert chainId to hex if it's in CAIP format, otherwise use as-is
      let hexChainId: string;
      try {
        // Check if it's in CAIP format (contains ':')
        if (networkChainId.includes(':')) {
          hexChainId = convertCaipToHexChainId(networkChainId as CaipChainId);
        } else {
          // Already in hex format
          hexChainId = networkChainId;
        }
      } catch (error) {
        // If conversion fails, use the original chainId
        hexChainId = networkChainId;
      }

      return Boolean(
        isGasFeesSponsoredNetworkEnabled?.[
          hexChainId as keyof typeof isGasFeesSponsoredNetworkEnabled
        ],
      );
    },
    [isGasFeesSponsoredNetworkEnabled],
  );

  const renderButton = useCallback(() => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return onDeleteClick || onEditClick || onDiscoverClick ? (
      <ButtonIcon
        iconName={IconName.MoreVertical}
        ref={setNetworkListItemMenuRef}
        data-testid={`network-list-item-options-button-${chainId}`}
        ariaLabel={t('networkOptions')}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setNetworkOptionsMenuOpen(true);
        }}
        size={ButtonIconSize.Sm}
      />
    ) : null;
  }, [
    onDeleteClick,
    onEditClick,
    onDiscoverClick,
    chainId,
    t,
    setNetworkListItemMenuRef,
    setNetworkOptionsMenuOpen,
  ]);
  useEffect(() => {
    if (networkRef.current && focus) {
      networkRef.current.focus();
    }
  }, [networkRef, focus]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation(); // Prevent the event from reaching the parent container
      onClick();
    }
  };

  return (
    <Box
      data-testid={`network-list-item-${chainId}`}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={rpcEndpoint ? 2 : 4}
      paddingBottom={rpcEndpoint ? 2 : 4}
      gap={4}
      backgroundColor={
        selected
          ? BoxBackgroundColor.PrimaryMuted
          : BoxBackgroundColor.Transparent
      }
      className={classnames('multichain-network-list-item', 'w-full', 'flex', {
        'multichain-network-list-item--selected': selected,
        'multichain-network-list-item--deselected': !selected,
        'multichain-network-list-item--disabled': disabled,
        'multichain-network-list-item--not-selectable': notSelectable,
      })}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      onClick={disabled ? undefined : onClick}
    >
      {startAccessory ? <Box marginTop={1}>{startAccessory}</Box> : null}
      {isIconSrc(iconSrc) ? (
        <AvatarIcon
          iconName={iconSrc}
          size={(iconSize as AvatarIconSize) || AvatarIconSize.Md}
          iconProps={{
            color:
              iconColor && iconColor in IconColor
                ? (iconColor as IconColor)
                : IconColor.PrimaryDefault,
          }}
        />
      ) : (
        <AvatarNetwork
          name={name}
          src={iconSrc}
          size={iconSize as AvatarNetworkSize}
        />
      )}
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        justifyContent={BoxJustifyContent.Start}
        className="w-full overflow-hidden flex"
      >
        <Box
          className="w-full flex"
          alignItems={BoxAlignItems.Center}
          data-testid={name}
        >
          <Tooltip
            title={name}
            position="bottom"
            wrapperClassName="multichain-network-list-item__tooltip"
            disabled={name?.length <= MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP}
          >
            <Text
              color={TextColor.TextDefault}
              variant={variant ?? TextVariant.BodyMd}
              className="truncate"
              asChild
            >
              <div
                ref={networkRef}
                onKeyDown={handleKeyPress}
                tabIndex={0} // Enable keyboard focus
              >
                {name}
              </div>
            </Text>
          </Tooltip>
        </Box>
        {isNetworkGasSponsored(chainId) && (
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('noNetworkFee')}
          </Text>
        )}
        {rpcEndpoint && (
          <Box
            className="multichain-network-list-item__rpc-endpoint flex"
            alignItems={BoxAlignItems.Center}
            data-testid={`network-rpc-name-button-${chainId}`}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRpcEndpointClick?.();
            }}
          >
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              className="truncate"
            >
              {rpcEndpoint.name ?? new URL(rpcEndpoint.url).host}
            </Text>
            <Box style={{ marginLeft: '4px' }}>
              <Icon
                color={IconColor.IconAlternative}
                name={IconName.ArrowDown}
                size={IconSize.Xs}
              />
            </Box>
          </Box>
        )}
      </Box>

      {renderButton()}
      {showEndAccessory
        ? (endAccessory ?? (
            <NetworkListItemMenu
              anchorElement={networkListItemMenuElement}
              isOpen={networkOptionsMenuOpen}
              onDeleteClick={onDeleteClick}
              onEditClick={onEditClick}
              onDiscoverClick={onDiscoverClick}
              onClose={() => setNetworkOptionsMenuOpen(false)}
            />
          ))
        : null}
    </Box>
  );
};

NetworkListItem.propTypes = {
  /**
   * The name of the network
   */
  name: PropTypes.string.isRequired,
  /**
   * Path to the Icon image
   */
  iconSrc: PropTypes.string,
  /**
   * Icon network size
   */
  iconSize: PropTypes.string,
  /**
   * Represents if the network item is selected
   */
  selected: PropTypes.bool,
  /**
   * Executes when the item is clicked
   */
  onClick: PropTypes.func.isRequired,
  /**
   * Executes when the delete icon is clicked
   */
  onDeleteClick: PropTypes.func,
  /**
   * Executes when the edit icon is clicked
   */
  onEditClick: PropTypes.func,
  /**
   * Represents if the network item should be keyboard selected
   */
  focus: PropTypes.bool,
  /**
   * Represents start accessory
   */
  startAccessory: PropTypes.node,
  /**
   * Represents end accessory
   */
  endAccessory: PropTypes.node,
  /**
   * Represents if we need to show menu option or endAccessory
   */
  showEndAccessory: PropTypes.bool,
};
