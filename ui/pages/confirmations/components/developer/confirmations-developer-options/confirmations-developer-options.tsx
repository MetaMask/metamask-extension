import React from 'react';

import { Text } from '../../../../../components/component-library';
import { TextColor } from '../../../../../helpers/constants/design-system';
import { PerpsDepositButton } from '../perps-deposit-button';

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
        Example Confirmations
      </Text>
      <div className="settings-page__content-padded">
        <PerpsDepositButton />
      </div>
    </>
  );
};
