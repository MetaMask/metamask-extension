import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
import {
  AlignItems,
  IconColor,
  BorderRadius,
  Color,
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
}) => {
  const t = useI18nContext();
  return (
    <Box
      onClick={onClick}
      padding={4}
      className={classnames('network-list-item', {
        'network-list-item--selected': selected,
      })}
      alignItems={AlignItems.center}
    >
      {selected && (
        <Box
          className="network-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={Color.primaryDefault}
        />
      )}
      <AvatarNetwork name={name} src={iconSrc} />
      <Box style={{width: '100%', display: 'flex'}}>
        <Text ellipsis>{name}</Text>
      </Box>
      <ButtonIcon
        className="network-list-item__delete"
        color={IconColor.errorDefault}
        iconName={ICON_NAMES.TRASH}
        ariaLabel={t('deleteNetwork')}
      />
    </Box>
  );
};

NetworkListItem.propTypes = {
  networkName: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};
