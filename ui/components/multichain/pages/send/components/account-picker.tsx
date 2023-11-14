import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { getSelectedIdentity } from '../../../../../selectors';
import { Label } from '../../../../component-library';
import { AccountPicker } from '../../../account-picker';
import {
  BlockSize,
  BorderColor,
  Display,
  JustifyContent,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import { I18nContext } from '../../../../../contexts/i18n';
import { AccountListMenu } from '../../..';
import { SendPageRow } from '.';

export const SendPageAccountPicker = () => {
  const t = useContext(I18nContext);
  const identity = useSelector(getSelectedIdentity);

  const [showAccountPicker, setShowAccountPicker] = useState(false);

  return (
    <SendPageRow>
      <Label paddingBottom={2}>{t('from')}</Label>
      <AccountPicker
        className="multichain-send-page__account-picker"
        address={identity.address}
        name={identity.name}
        onClick={() => setShowAccountPicker(true)}
        showAddress
        borderColor={BorderColor.borderDefault}
        borderWidth={1}
        paddingTop={4}
        paddingBottom={4}
        block
        justifyContent={JustifyContent.flexStart}
        addressProps={{
          display: Display.Flex,
          textAlign: TextAlign.Start,
        }}
        labelProps={{
          style: { flexGrow: 1, textAlign: 'start' },
          paddingInlineStart: 2,
        }}
        textProps={{
          display: Display.Flex,
          width: BlockSize.Full,
        }}
        width={BlockSize.Full}
      />
      {showAccountPicker ? (
        <AccountListMenu
          accountListItemProps={{ showOptions: false }}
          showAccountCreation={false}
          onClose={() => setShowAccountPicker(false)}
        />
      ) : null}
    </SendPageRow>
  );
};
