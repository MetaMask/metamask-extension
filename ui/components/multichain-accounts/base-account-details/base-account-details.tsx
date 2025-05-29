import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppSliceState } from '../../../ducks/app/app';
import { getInternalAccountByAddress, getUseBlockie } from '../../../selectors';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  ButtonIcon,
  ButtonIconSize,
  ModalHeader,
  Modal,
  Text,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  FormTextField,
} from '../../component-library';
import { Content, Header, Page } from '../../multichain/pages/page';
import {
  AlignItems,
  BackgroundColor,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { IconName } from '../../component-library/icon';
import { useHistory } from 'react-router-dom';
import { isEvmAccountType } from '@metamask/keyring-api';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { shortenAddress } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setAccountLabel } from '../../../store/actions';

type BaseAccountDetailsProps = {
  children: React.ReactNode | React.ReactNode[];
};

export const BaseAccountDetails = ({ children }: BaseAccountDetailsProps) => {
  const address = useSelector(
    (state: AppSliceState) => state.appState.accountDetailsAddress,
  );
  const useBlockie = useSelector(getUseBlockie);
  const history = useHistory();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const {
    metadata: { name },
    type,
  } = account;
  const formattedAddress = isEvmAccountType(type)
    ? toChecksumHexAddress(address)?.toLowerCase()
    : address;
  const shortenedAddress = shortenAddress(formattedAddress);

  const [isEditingAccountName, setIsEditingAccountName] = useState(false);
  const [accountName, setAccountName] = useState('');
  const handleEditAccountName = () => {
    setIsEditingAccountName(true);
  };

  const handleShowAddress = () => {
    // TODO: Implement new route for show QR code/address
  }

  const handleSaveAccountName = () => {
    setIsEditingAccountName(false);
    dispatch(setAccountLabel(address, accountName));

  }

  // TODO: move this to its own file
  const DetailRow = ({
    label,
    value,
    endAccessory,
    style,
  }: {
    label: string;
    value: string;
    endAccessory?: React.ReactNode;
    style?: React.CSSProperties;
  }) => {
    return (
      <Box
        backgroundColor={BackgroundColor.backgroundAlternative}
        display={Display.Flex}
        justifyContent={JustifyContent.spaceBetween}
        style={{ ...style, height: '48px' }}
        paddingLeft={4}
        paddingRight={4}
        alignItems={AlignItems.center}
      >
        <Text color={TextColor.textDefault}>{label}</Text>
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          <Text color={TextColor.textAlternative}>{value}</Text>
          {endAccessory}
        </Box>
      </Box>
    );
  };

  const EditAccountNameModal = () => {
    return (
      <Modal isOpen={isEditingAccountName} onClose={() => setIsEditingAccountName(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onBack={() => setIsEditingAccountName(false)} onClose={() => setIsEditingAccountName(false)}>{t('editAccountName')}</ModalHeader>
          <ModalBody>
            <FormTextField
              label={t('name')}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={name}
              helpText={address}
            />
          </ModalBody>
          <ModalFooter onSubmit={handleSaveAccountName} submitButtonProps={{ children: t('save'), disabled: !accountName }} />
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Page backgroundColor={BackgroundColor.backgroundDefault}>
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
        }
      >
        {name}
      </Header>
      <Content>
        <AvatarAccount
          address={address}
          variant={
            useBlockie
              ? AvatarAccountVariant.Blockies
              : AvatarAccountVariant.Jazzicon
          }
          size={AvatarAccountSize.Lg}
          style={{ margin: '0 auto' }}
        />
        <Box className="multichain-account-details__section">
          <DetailRow
            label={t('accountName')}
            value={name}
            endAccessory={
              <ButtonIcon
                iconName={IconName.Edit}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('edit')}
                onClick={() => {

                }}
                marginLeft={2}
              />
            }
            style={{
              marginBottom: '1px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
            }}
          />
          <DetailRow
            label={t('address')}
            value={shortenedAddress}
            endAccessory={
              <ButtonIcon
                iconName={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={ButtonIconSize.Md}
                ariaLabel={t('next')}
                onClick={handleShowAddress}
                marginLeft={2}
              />
            }
            style={{
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px',
            }}
          />
        </Box>
        {children}
      </Content>
    </Page>
  );
};
