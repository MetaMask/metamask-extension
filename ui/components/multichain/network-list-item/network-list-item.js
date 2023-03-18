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
      as="button"
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
          {name}
        </Text>
      </Box>
      {onDeleteClick ? (
        <ButtonIcon
          className="network-list-item__delete"
          color={IconColor.errorDefault}
          iconName={ICON_NAMES.TRASH}
          ariaLabel={t('deleteNetwork')}
          size={Size.SM}
          as="div"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDeleteClick();
          }}
        />
      ) : null}
    </Box>
  );
};

NetworkListItem.propTypes = {
  name: PropTypes.string.isRequired,
  iconSrc: PropTypes.string,
  selected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func,
};
