import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../../../../selectors';
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
import { SEND_STAGES } from '../../../../../ducks/send';
import { SendPageRow } from '.';

type SendPageAccountPickerProps = {
  sendStage: string;
};

export const SendPageAccountPicker = ({
  sendStage,
}: SendPageAccountPickerProps) => {
  const t = useContext(I18nContext);
  const internalAccount = useSelector(getSelectedInternalAccount);

  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const disabled = sendStage === SEND_STAGES.EDIT;
  const accountListItemProps = { showOptions: false };
  const onAccountListMenuClose = useCallback(() => {
    setShowAccountPicker(false);
  }, []);

  return (
    <SendPageRow>
      <Label paddingBottom={2}>{t('from')}</Label>
      <AccountPicker
        className="multichain-send-page__account-picker"
        account={internalAccount}
        onClick={() => setShowAccountPicker(true)}
        showAddress
        borderColor={BorderColor.borderMuted}
        borderWidth={1}
        paddingTop={4}
        paddingBottom={4}
        paddingLeft={3}
        block
        justifyContent={JustifyContent.flexStart}
        addressProps={{
          display: Display.Flex,
          textAlign: TextAlign.Start,
        }}
        labelProps={{
          style: { flexGrow: 1, textAlign: 'start' },
          paddingInlineStart: 1,
          className: 'multichain-send-page__account-picker__label',
        }}
        textProps={{
          display: Display.Flex,
          width: BlockSize.Full,
        }}
        width={BlockSize.Full}
        disabled={disabled}
        data-testid="send-page-account-picker"
      />
      {showAccountPicker ? (
        <AccountListMenu
          accountListItemProps={accountListItemProps}
          showAccountCreation={false}
          onClose={onAccountListMenuClose}
        />
      ) : null}
    </SendPageRow>
  );
};
