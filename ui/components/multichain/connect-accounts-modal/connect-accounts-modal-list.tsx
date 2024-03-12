import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { getOriginOfCurrentTab } from '../../../selectors/selectors';
import { getURLHost } from '../../../helpers/utils/util';
import { addMorePermittedAccounts } from '../../../store/actions';
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
}) => {
  const t = useI18nContext();
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const dispatch = useDispatch();
  return (
    <Modal isOpen onClose={onClose} data-testid="connect-more-accounts">
      <ModalOverlay />
      <ModalContent>
        {/* Todo: Replace this with i18 text */}
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
          <ButtonPrimary
            data-testid="connect-more-accounts-button"
            onClick={() => {
              dispatch(
                addMorePermittedAccounts(activeTabOrigin, selectedAccounts),
              );
              onClose();
            }}
            size={ButtonPrimarySize.Lg}
            block
          >
            {t('confirm')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
