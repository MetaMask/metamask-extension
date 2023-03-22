import React from 'react';
import PropTypes from 'prop-types';
import {
  ButtonBase,
  ICON_NAMES,
  AvatarAccount,
  Text,
} from '../../component-library';
import Box from '../../ui/box/box';
import {
  BackgroundColor,
  DISPLAY,
  FONT_WEIGHT,
  Size,
} from '../../../helpers/constants/design-system';

export const AccountPicker = ({ account, onClick }) => {
  return (
    <ButtonBase
      className="multichain-account-picker"
      onClick={onClick}
      backgroundColor={BackgroundColor.transparent}
      endIconName={ICON_NAMES.ARROW_DOWN}
      ellipsis
    >
      <Box display={DISPLAY.FLEX} gap={2}>
        <AvatarAccount address={account.address} size={Size.SM} />
        <Text as="span" fontWeight={FONT_WEIGHT.BOLD} ellipsis>
          {account.name}
        </Text>
        <Icon name={ICON_NAMES.ARROW_DOWN} size={Size.SM} />
      </Box>
    </ButtonBase>
  );
};

AccountPicker.propTypes = {
  /**
   * Account object
   */
  account: PropTypes.shape({
    address: PropTypes.string,
    name: PropTypes.string,
    balance: PropTypes.string,
  }).isRequired,
  /**
   * Action to perform when the account picker is clicked
   */
  onClick: PropTypes.func.isRequired,
};
