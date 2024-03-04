import React from 'react';
import {
  Box,
  ButtonPrimary,
  Checkbox,
  Icon,
  IconName,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AccountListItem } from '..';
import { ConnectAccountsListProps } from './connect-account-modal.types';
import {
  Display,
  IconColor,
  JustifyContent,
  TextColor,
} from '../../../helpers/constants/design-system';
import Tooltip from '../../ui/tooltip/tooltip';
import { useSelector } from 'react-redux';
import { getOriginOfCurrentTab } from '../../../selectors/selectors';
import { getURLHost } from '../../../helpers/utils/util';

export const ConnectAccountsList: React.FC<ConnectAccountsListProps> = ({
  onClose,
  allAreSelected,
  deselectAll,
  selectAll,
  handleAccountClick,
  selectedAccounts,
  accounts,
  checked,
  isIndeterminate,
}) => {
  const t = useI18nContext();
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        {/* Todo: Replace this with i18 text */}
        <ModalHeader onClose={onClose}>Connect more accounts</ModalHeader>
        <ModalBody>
          <Box
            padding={4}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Checkbox
              label={t('selectAll')}
              isChecked={checked}
              onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
              isIndeterminate={isIndeterminate}
            />
            <Text
              color={TextColor.textAlternative}
              as="div"
              display={Display.Flex}
            >
              <Tooltip
                html={t('connectedAccountsListTooltip', [
                  <strong>{getURLHost(activeTabOrigin)}</strong>,
                ])}
              >
                <Icon name={IconName.Info} color={IconColor.iconMuted} />
              </Tooltip>
              {t('permissions')}
            </Text>
          </Box>
          {accounts.map((account) => {
            const isSelectedAccount = selectedAccounts.includes(
              account.address,
            );
            return (
              <AccountListItem
                onClick={() => handleAccountClick(account.address)}
                identity={account}
                key={account.address}
                closeMenu={onClose}
                startAccessory={<Checkbox isChecked={isSelectedAccount} />}
              />
            );
          })}
        </ModalBody>
        <ModalFooter>
          {/* Todo: Implement onClick handler */}
          <ButtonPrimary onClick={() => console.log(selectedAccounts)} block>
            {t('confirm')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
