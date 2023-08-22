import React, { useCallback, useEffect, useState } from 'react';
import { NameValueType } from '@metamask/name-controller';
import { useDispatch, useSelector } from 'react-redux';
import {
  BUTTON_VARIANT,
  Box,
  Button,
  FormTextField,
  IconName,
  Label,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  BlockSize,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import Name from '../name/name';
import FormComboField from '../../form-combo-field/form-combo-field';
import { getNames } from '../../../../selectors';
import { setName as saveName } from '../../../../store/actions';

const PROVIDER_LABELS: { [providerId: string]: string } = {
  ens: 'Ethereum Name Service (ENS)',
  opensea: 'OpenSea',
};

export interface NameDetailsProps {
  onClose: () => void;
  type: NameValueType;
  value: string;
}

export default function NameDetails({
  onClose,
  type,
  value,
}: NameDetailsProps) {
  const names = useSelector(getNames);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState(undefined);
  const dispatch = useDispatch();

  const handleSaveClick = useCallback(async () => {
    await dispatch(saveName({ value, type, name, provider }));
    onClose();
  }, [name, provider, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);
    },
    [setName],
  );

  const handleProviderClick = useCallback(
    (option: any) => {
      setProvider(option.providerId);
    },
    [setProvider],
  );

  useEffect(() => {
    const savedName = names[type]?.[value]?.name;

    if (!savedName) {
      return;
    }

    setName(savedName);
  }, [names, setName, type, value]);

  const proposedNames = names[type]?.[value]?.proposed || {};

  const options = Object.keys(proposedNames)
    .sort()
    .map((providerId: string) => ({
      primaryLabel: proposedNames[providerId],
      secondaryLabel: PROVIDER_LABELS[providerId] ?? providerId,
    }));

  const savedName = names[type]?.[value]?.name;
  const hasSavedName = Boolean(savedName);

  return (
    <Box>
      <Modal isOpen onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleClose} onBack={handleClose}>
            {hasSavedName ? 'Saved address' : 'Unknown address'}
          </ModalHeader>
          <div style={{ textAlign: 'center', marginBottom: 16, marginTop: 8 }}>
            <Name
              value={value}
              type={NameValueType.ETHEREUM_ADDRESS}
              providerPriority={['ens']}
            />
          </div>
          {!hasSavedName && (
            <Text marginBottom={4} justifyContent={JustifyContent.spaceBetween}>
              You are interacting with an unknown contract address. If you trust
              this author, set a personal display name to identify it going
              forward.
            </Text>
          )}
          {hasSavedName && (
            <Text marginBottom={4} justifyContent={JustifyContent.spaceBetween}>
              Interactions with this address will always be identified using
              this personal display name.
            </Text>
          )}
          <hr className="name-details__line" />
          <FormTextField
            id="form-text-field"
            label="Contract address"
            value={value}
            marginBottom={4}
            disabled
          />
          <Label
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.flexStart}
            marginBottom={2}
            className="name-details__display-name"
          >
            Display name
            <FormComboField
              options={options}
              placeholder="Set a personal display name..."
              onChange={handleNameChange}
              onOptionClick={handleProviderClick}
              value={name}
            />
          </Label>
          <hr className="name-details__line" />
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            startIconName={hasSavedName ? undefined : IconName.Save}
            width={BlockSize.Full}
            onClick={handleSaveClick}
          >
            {hasSavedName ? 'OK' : 'Save'}
          </Button>
        </ModalContent>
      </Modal>
    </Box>
  );
}
