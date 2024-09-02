import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Color,
  Display,
  JustifyContent,
  TextColor,
  Size,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAvatarNetworkColor } from '../../../helpers/utils/accounts';
import Tooltip from '../../ui/tooltip/tooltip';
import { NetworkListItemMenu } from '../network-list-item-menu';
import { getLocalNetworkMenuRedesignFeatureFlag } from '../../../helpers/utils/feature-flags';

const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 20;

export const NetworkListItem = ({
  name,
  iconSrc,
  iconSize = AvatarNetworkSize.Md,
  selected = false,
  focus = true,
  onClick,
  onDeleteClick,
  onEditClick,
  startAccessory,
  showEndAccessory = true,
}) => {
  const t = useI18nContext();
  const networkRef = useRef();

  const [networkListItemMenuElement, setNetworkListItemMenuElement] =
    useState();
  const setNetworkListItemMenuRef = (ref) => {
    setNetworkListItemMenuElement(ref);
  };
  const [networkOptionsMenuOpen, setNetworkOptionsMenuOpen] = useState(false);
  const networkMenuRedesign = useSelector(
    getLocalNetworkMenuRedesignFeatureFlag,
  );

  const renderButton = () => {
    if (networkMenuRedesign) {
      return onDeleteClick || onEditClick ? (
        <ButtonIcon
          iconName={IconName.MoreVertical}
          ref={setNetworkListItemMenuRef}
          data-testid="network-list-item-options-button"
          ariaLabel={t('networkOptions')}
          onClick={(e) => {
            e.stopPropagation();
            setNetworkOptionsMenuOpen(true);
          }}
          size={ButtonIconSize.Sm}
        />
      ) : null;
    }

    return onDeleteClick ? (
      <ButtonIcon
        className="multichain-network-list-item__delete"
        color={IconColor.errorDefault}
        iconName={IconName.Trash}
        ariaLabel={t('deleteNetwork')}
        size={Size.SM}
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick();
        }}
      />
    ) : null;
  };
  useEffect(() => {
    if (networkRef.current && focus) {
      networkRef.current.focus();
    }
  }, [networkRef, focus]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation(); // Prevent the event from reaching the parent container
      onClick();
    }
  };

  return (
    <Box
      padding={4}
      gap={4}
      backgroundColor={selected ? Color.primaryMuted : Color.transparent}
      className={classnames('multichain-network-list-item', {
        'multichain-network-list-item--selected': selected,
      })}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      width={BlockSize.Full}
      onClick={onClick}
    >
      {startAccessory ? <Box marginTop={1}>{startAccessory}</Box> : null}
      {selected && (
        <Box
          className="multichain-network-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={Color.primaryDefault}
        />
      )}
      <AvatarNetwork
        backgroundColor={getAvatarNetworkColor(name)}
        name={name}
        src={iconSrc}
        size={iconSize}
      />
      <Box
        className="multichain-network-list-item__network-name"
        display={Display.Flex}
        alignItems={AlignItems.center}
        data-testid={name}
      >
        <Text
          ref={networkRef}
          color={TextColor.textDefault}
          backgroundColor={BackgroundColor.transparent}
          ellipsis
          onKeyDown={handleKeyPress}
          tabIndex="0" // Enable keyboard focus
        >
          {name.length > MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP ? (
            <Tooltip
              title={name}
              position="bottom"
              wrapperClassName="multichain-network-list-item__tooltip"
            >
              {name}
            </Tooltip>
          ) : (
            name
          )}
        </Text>
      </Box>
      {renderButton()}
      {showEndAccessory ? (
        <NetworkListItemMenu
          anchorElement={networkListItemMenuElement}
          isOpen={networkOptionsMenuOpen}
          onDeleteClick={onDeleteClick}
          onEditClick={onEditClick}
          onClose={() => setNetworkOptionsMenuOpen(false)}
        />
      ) : null}
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
   * Represents if we need to show menu option
   */
  showEndAccessory: PropTypes.bool,
};
