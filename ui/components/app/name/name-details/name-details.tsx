/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { NameType } from '@metamask/name-controller';
import { useDispatch, useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import {
  BUTTON_VARIANT,
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
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
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import Name from '../name';
import FormComboField from '../../form-combo-field/form-combo-field';
import { getNameSources } from '../../../../selectors';
import { setName as saveName } from '../../../../store/actions';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { useName } from '../../../../hooks/useName';
import { I18nContext } from '../../../../contexts/i18n';

export interface NameDetailsProps {
  onClose: () => void;
  type: NameType;
  value: string;
}

export default function NameDetails({
  onClose,
  type,
  value,
}: NameDetailsProps) {
  const { name: savedName, proposedNames } = useName(value, type);
  const nameSources = useSelector(getNameSources, isEqual);
  const [name, setName] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState(undefined);
  const dispatch = useDispatch();
  const t = useContext(I18nContext);

  const [copiedAddress, handleCopyAddress] = useCopyToClipboard() as [
    boolean,
    (value: string) => void,
  ];

  const handleSaveClick = useCallback(async () => {
    await dispatch(saveName({ value, type, name, sourceId: selectedSourceId }));
    onClose();
  }, [name, selectedSourceId, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);
    },
    [setName],
  );

  const handleProposedNameClick = useCallback(
    (option: any) => {
      setSelectedSourceId(option.providerId);
    },
    [setSelectedSourceId],
  );

  const proposedNameOptions = useMemo(() => {
    const sourceIds = Object.keys(proposedNames);

    const sourceIdsWithProposedNames = sourceIds.filter(
      (sourceId) => proposedNames[sourceId]?.length,
    );

    const options = sourceIdsWithProposedNames
      .map((sourceId: string) => {
        const sourceProposedNames = proposedNames[sourceId] ?? [];

        return sourceProposedNames.map((proposedName: any) => ({
          primaryLabel: proposedName,
          secondaryLabel: nameSources[sourceId]?.label ?? sourceId,
        }));
      })
      .flat();

    return options.sort((a, b) =>
      a.primaryLabel.toLowerCase().localeCompare(b.primaryLabel.toLowerCase()),
    );
  }, [proposedNames, nameSources]);

  useEffect(() => {
    setName(savedName ?? '');
  }, [savedName, setName]);

  const hasSavedName = Boolean(savedName);

  return (
    <Box>
      <Modal isOpen onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleClose} onBack={handleClose}>
            {hasSavedName ? t('nameModalTitleSaved') : t('nameModalTitleNew')}
          </ModalHeader>
          <div style={{ textAlign: 'center', marginBottom: 16, marginTop: 8 }}>
            <Name
              value={value}
              type={NameType.ETHEREUM_ADDRESS}
              sourcePriority={['lens', 'token', 'ens', 'etherscan']}
              disableEdit
            />
          </div>
          <Text marginBottom={4} justifyContent={JustifyContent.spaceBetween}>
            {hasSavedName
              ? t('nameInstructionsSaved')
              : t('nameInstructionsNew')}
          </Text>
          <hr className="name-details__line" />
          {/* @ts-ignore */}
          <FormTextField
            id="address"
            className="name-details__address"
            label={t('nameAddressLabel')}
            value={value}
            marginBottom={4}
            disabled
            endAccessory={
              <ButtonIcon
                display={Display.Flex}
                iconName={copiedAddress ? IconName.CopySuccess : IconName.Copy}
                size={ButtonIconSize.Sm}
                onClick={() => handleCopyAddress(value)}
                color={IconColor.iconMuted}
                ariaLabel={t('copyAddress')}
              />
            }
          />
          <Label
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.flexStart}
            marginBottom={2}
            className="name-details__display-name"
          >
            {t('nameLabel')}
            <FormComboField
              options={proposedNameOptions}
              placeholder={t('nameSetPlaceholder')}
              onChange={handleNameChange}
              onOptionClick={handleProposedNameClick}
              value={name}
              maxDropdownHeight={170}
            />
          </Label>
          <hr className="name-details__line" />
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            startIconName={hasSavedName ? undefined : IconName.Save}
            width={BlockSize.Full}
            onClick={handleSaveClick}
          >
            {hasSavedName ? t('ok') : t('save')}
          </Button>
        </ModalContent>
      </Modal>
    </Box>
  );
}
