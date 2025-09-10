import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { Recipient } from '../../UI/recipient';
import {
  type Recipient as RecipientType,
  useRecipients,
} from '../../../hooks/send/useRecipients';
import { getUseBlockie } from '../../../../../selectors';
import { Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useSendRecipientFilter } from '../../../hooks/send/useSendRecipientFilter';
import { RecipientFilterInput } from '../recipient-filter-input';

const AccountsList = ({
  recipients,
  handleSelectRecipient,
}: {
  recipients: RecipientType[];
  handleSelectRecipient: (recipient: RecipientType) => void;
}) => {
  const useBlockie = useSelector(getUseBlockie);

  // Group recipients by wallet name
  const groupedByWallet = recipients.reduce(
    (acc, recipient) => {
      const walletName = recipient.walletName || 'Unknown Wallet';
      if (!acc[walletName]) {
        acc[walletName] = [];
      }
      acc[walletName].push(recipient);
      return acc;
    },
    {} as Record<string, RecipientType[]>,
  );

  return (
    <>
      {Object.entries(groupedByWallet).map(([walletName, walletRecipients]) => (
        <React.Fragment key={walletName}>
          <Text
            color={TextColor.textAlternative}
            paddingTop={4}
            paddingBottom={4}
            variant={TextVariant.bodyMdMedium}
          >
            {walletName}
          </Text>
          {walletRecipients.map((recipient) => (
            <Recipient
              isAccount
              key={recipient.address}
              recipient={recipient}
              useBlockie={useBlockie}
              onClick={handleSelectRecipient}
            />
          ))}
        </React.Fragment>
      ))}
    </>
  );
};

const ContactsList = ({
  recipients,
  handleSelectRecipient,
}: {
  recipients: RecipientType[];
  handleSelectRecipient: (recipient: RecipientType) => void;
}) => {
  const useBlockie = useSelector(getUseBlockie);
  const t = useI18nContext();

  if (recipients.length === 0) {
    return null;
  }

  return (
    <>
      <Text
        color={TextColor.textAlternative}
        paddingTop={4}
        paddingBottom={4}
        variant={TextVariant.bodyMdMedium}
      >
        {t('contacts')}
      </Text>
      {recipients.map((recipient) => (
        <Recipient
          key={recipient.address}
          recipient={recipient}
          useBlockie={useBlockie}
          onClick={handleSelectRecipient}
        />
      ))}
    </>
  );
};

export const RecipientList = ({
  hideModal,
  onToChange,
}: {
  hideModal: () => void;
  onToChange: (address: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const recipients = useRecipients();
  const contactRecipients = recipients.filter(
    (recipient) => recipient.contactName,
  );
  const accountRecipients = recipients.filter(
    (recipient) => recipient.accountGroupName,
  );
  const { filteredContactRecipients, filteredAccountRecipients } =
    useSendRecipientFilter({
      contactRecipients,
      accountRecipients,
      searchQuery,
    });

  const handleSelectRecipient = useCallback(
    (recipient: RecipientType) => {
      onToChange(recipient.address);
      hideModal();
    },
    [hideModal, onToChange],
  );

  return (
    <>
      <RecipientFilterInput
        searchQuery={searchQuery}
        onChange={setSearchQuery}
      />
      <AccountsList
        handleSelectRecipient={handleSelectRecipient}
        recipients={filteredAccountRecipients}
      />
      <ContactsList
        handleSelectRecipient={handleSelectRecipient}
        recipients={filteredContactRecipients}
      />
    </>
  );
};
