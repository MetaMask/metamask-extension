import React from 'react';
import PropTypes from 'prop-types';
import {
  ButtonBase,
  ICON_NAMES,
  AvatarAccount,
  Icon,
  Text,
} from '../../component-library';
import {
  AlignItems,
  Color,
  DISPLAY,
  FONT_WEIGHT,
  Size,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';

export const AccountPicker = ({ account, onClick }) => {
  return (
    <ButtonBase onClick={onClick} backgroundColor={Color.transparent} ellipsis>
      <Box display={DISPLAY.FLEX} alignItems={AlignItems.center} gap={3}>
        <AvatarAccount address={account.address} size={Size.SM} />
        <Text fontWeight={FONT_WEIGHT.BOLD} ellipsis>
          {account.name}
        </Text>
        <Icon name={ICON_NAMES.ARROW_DOWN} size={Size.SM} />
      </Box>
    </ButtonBase>
  );
};

AccountPicker.propTypes = {
  account: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};
