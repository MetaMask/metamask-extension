import React, { useEffect, useRef } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Color,
  Display,
  IconColor,
  JustifyContent,
  Size,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  Box,
  ButtonIcon,
  Icon,
  IconName,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAvatarNetworkColor } from '../../../helpers/utils/accounts';
import Tooltip from '../../ui/tooltip/tooltip';
import { AURORA_ETH_DISPLAY_NAME } from '../../../../shared/constants/network';

const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 20;

export const NetworkListItem = ({
  name,
  iconSrc,
  selected = false,
  focus = true,
  onClick,
  onDeleteClick,
  isDeprecatedNetwork,
}) => {
  const t = useI18nContext();
  const networkRef = useRef();

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
      gap={2}
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
      />
      <Box
        className="multichain-network-list-item__network-name"
        display={Display.Flex}
        alignItems={AlignItems.center}
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
        {isDeprecatedNetwork ? (
          <Tooltip
            title={t('auroraDeprecationWarning', [AURORA_ETH_DISPLAY_NAME])}
            position="top"
          >
            <Icon name={IconName.Danger} color={IconColor.warningDefault} />
          </Tooltip>
        ) : null}
      </Box>
      {onDeleteClick ? (
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
   * Represents if the network item should be keyboard selected
   */
  focus: PropTypes.bool,
  /**
   * Boolean to know if the network is deprecated
   */
  isDeprecatedNetwork: PropTypes.bool,
};
