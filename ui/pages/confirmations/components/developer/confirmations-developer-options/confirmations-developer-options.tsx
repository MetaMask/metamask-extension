import React from 'react';

import { Box, Text } from '../../../../../components/component-library';
import {
  Display,
  FlexWrap,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { MusdConversionButton } from '../musd-conversion-button';
import { PerpsDepositButton } from '../perps-deposit-button';
import { PerpsWithdrawButton } from '../perps-withdraw-button';

export const ConfirmationsDeveloperOptions = () => {
  return (
    <>
      <Text
        className="settings-page__security-tab-sub-header__bold"
        paddingTop={6}
      >
        Confirmations
      </Text>
      <Text
        className="settings-page__security-tab-sub-header"
        color={TextColor.textAlternative}
        paddingTop={4}
      >
        Test Confirmations
      </Text>
      <Box
        display={Display.Flex}
        flexWrap={FlexWrap.Wrap}
        gap={2}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
      >
        <PerpsDepositButton />
        <PerpsWithdrawButton />
        <MusdConversionButton />
      </Box>
    </>
  );
};
