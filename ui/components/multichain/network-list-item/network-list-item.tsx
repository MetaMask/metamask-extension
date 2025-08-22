import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  JustifyContent,
  TextColor,
  IconColor,
  FlexDirection,
  TextVariant,
  BorderColor,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAvatarNetworkColor } from '../../../helpers/utils/accounts';
import Tooltip from '../../ui/tooltip/tooltip';
import { NetworkListItemMenu } from '../network-list-item-menu';

// TODO: Consider increasing this. This tooltip is
// rendering when it has enough room to see everything
const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 20;

export const NetworkListItem = ({
  name,
  iconSrc,
  iconSize = AvatarNetworkSize.Md,
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
  iconSrc?: string;
  iconSize?: AvatarNetworkSize;
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
  const networkRef = useRef<HTMLInputElement>(null);

  const [networkListItemMenuElement, setNetworkListItemMenuElement] =
    useState();

  // I can't find a type that satisfies this.

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setNetworkListItemMenuRef = (ref: any) => {
    setNetworkListItemMenuElement(ref);
  };
  const [networkOptionsMenuOpen, setNetworkOptionsMenuOpen] = useState(false);

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
        selected ? BackgroundColor.primaryMuted : BackgroundColor.transparent
      }
      className={classnames('multichain-network-list-item', {
        'multichain-network-list-item--selected': selected,
        'multichain-network-list-item--deselected': !selected,
        'multichain-network-list-item--disabled': disabled,
        'multichain-network-list-item--not-selectable': notSelectable,
      })}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      width={BlockSize.Full}
      onClick={disabled ? undefined : onClick}
    >
      {startAccessory ? <Box marginTop={1}>{startAccessory}</Box> : null}
      {selected && (
        <Box
          className="multichain-network-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={BackgroundColor.primaryDefault}
        />
      )}
      <AvatarNetwork
        borderColor={BorderColor.backgroundDefault}
        backgroundColor={getAvatarNetworkColor(name)}
        name={name}
        src={iconSrc}
        size={iconSize}
      />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        justifyContent={JustifyContent.flexStart}
        width={BlockSize.Full}
        style={{ overflow: 'hidden' }}
      >
        <Box
          width={BlockSize.Full}
          display={Display.Flex}
          alignItems={AlignItems.center}
          data-testid={name}
        >
          <Tooltip
            title={name}
            position="bottom"
            wrapperClassName="multichain-network-list-item__tooltip"
            disabled={name?.length <= MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP}
          >
            <Text
              ref={networkRef}
              color={TextColor.textDefault}
              backgroundColor={BackgroundColor.transparent}
              variant={variant ?? TextVariant.bodyMd}
              ellipsis
              onKeyDown={handleKeyPress}
              tabIndex={0} // Enable keyboard focus
            >
              {name}
            </Text>
          </Tooltip>
        </Box>
        {rpcEndpoint && (
          <Box
            className="multichain-network-list-item__rpc-endpoint"
            display={Display.Flex}
            alignItems={AlignItems.center}
            data-testid={`network-rpc-name-button-${chainId}`}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRpcEndpointClick?.();
            }}
          >
            <Text
              padding={0}
              backgroundColor={BackgroundColor.transparent}
              as="button"
              variant={TextVariant.bodySmMedium}
              color={TextColor.textAlternative}
              ellipsis
            >
              {rpcEndpoint.name ?? new URL(rpcEndpoint.url).host}
            </Text>
            <Icon
              marginLeft={1}
              color={IconColor.iconAlternative}
              name={IconName.ArrowDown}
              size={IconSize.Xs}
            />
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
