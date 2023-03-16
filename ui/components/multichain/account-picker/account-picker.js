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
  Color,
  FONT_WEIGHT,
  Size,
} from '../../../helpers/constants/design-system';

export const AccountPicker = ({ account, onClick }) => {
  return (
    <ButtonBase onClick={onClick} backgroundColor={Color.transparent}>
      <AvatarAccount address={account.address} size={Size.SM} />
      <Text
        marginLeft={1}
        marginRight={1}
        fontWeight={FONT_WEIGHT.BOLD}
        ellipsis
      >
        {account.name}
      </Text>
      <Icon name={ICON_NAMES.ARROW_DOWN} size={Size.SM} />
    </ButtonBase>
  );
};

AccountPicker.propTypes = {
  account: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};
