import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
import {
  AlignItems,
  IconColor,
  BorderRadius,
  Color,
  Size,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  ButtonIcon,
  ICON_NAMES,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Tooltip from '../../ui/tooltip/tooltip';

const MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP = 17;

export const NetworkListItem = ({
  name,
  iconSrc,
  selected = false,
  onClick,
  onDeleteClick,
}) => {
  const t = useI18nContext();
  return (
    <Box
      onClick={onClick}
      padding={4}
      gap={2}
      backgroundColor={selected ? Color.primaryMuted : Color.transparent}
      className={classnames('network-list-item', {
        'network-list-item--selected': selected,
      })}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
    >
      {selected && (
        <Box
          className="network-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={Color.primaryDefault}
        />
      )}
      <AvatarNetwork name={name} src={iconSrc} />
      <Box className="network-list-item__network-name">
        <Text as="div" ellipsis>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onClick();
            }}
          >
            {name.length > MAXIMUM_CHARACTERS_WITHOUT_TOOLTIP ? (
              <Tooltip
                title={name}
                position="bottom"
                wrapperClassName="network-list-item__tooltip"
              >
                {name}
              </Tooltip>
            ) : (
              name
            )}
          </a>
        </Text>
      </Box>
      {onDeleteClick ? (
        <ButtonIcon
          className="network-list-item__delete"
          color={IconColor.errorDefault}
          iconName={ICON_NAMES.TRASH}
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
};
