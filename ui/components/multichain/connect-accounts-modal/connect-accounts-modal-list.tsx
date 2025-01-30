import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
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
import {
  Display,
  IconColor,
  JustifyContent,
  TextColor,
} from '../../../helpers/constants/design-system';
import Tooltip from '../../ui/tooltip/tooltip';
import { getURLHost } from '../../../helpers/utils/util';
import { addPermittedAccounts } from '../../../store/actions';
import { ConnectAccountsListProps } from './connect-account-modal.types';

export const ConnectAccountsModalList: React.FC<ConnectAccountsListProps> = ({
  onClose,
  allAreSelected,
  deselectAll,
  selectAll,
  handleAccountClick,
  selectedAccounts,
  accounts,
  checked,
  isIndeterminate,
  onAccountsUpdate,
  activeTabOrigin,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  return (
    <Modal isOpen onClose={onClose} data-testid="connect-more-accounts">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          data-testid="connect-more-accounts-title"
          onClose={onClose}
        >
          {t('connectMoreAccounts')}
        </ModalHeader>
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
                distance={10}
                html={t('connectedAccountsListTooltip', [
                  <strong>{getURLHost(activeTabOrigin)}</strong>,
                ])}
                position="top"
              >
                <Icon
                  marginInlineEnd={2}
                  name={IconName.Info}
                  color={IconColor.iconMuted}
                />
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
                account={account}
                selected={isSelectedAccount}
                key={account.address}
                closeMenu={onClose}
                startAccessory={<Checkbox isChecked={isSelectedAccount} />}
              />
            );
          })}
        </ModalBody>
        <ModalFooter>
          <ButtonPrimary
            data-testid="connect-more-accounts-button"
            onClick={() => {
              dispatch(addPermittedAccounts(activeTabOrigin, selectedAccounts));
              onClose();
              onAccountsUpdate();
            }}
            size={ButtonPrimarySize.Lg}
            block
            disabled={selectedAccounts.length === 0}
          >
            {t('confirm')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
