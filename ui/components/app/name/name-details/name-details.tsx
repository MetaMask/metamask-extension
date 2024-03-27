/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  NameControllerState,
  NameEntry,
  NameType,
  UpdateProposedNamesResult,
} from '@metamask/name-controller';
import { useDispatch, useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { toChecksumAddress } from 'ethereumjs-util';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  FormTextField,
  IconName,
  Label,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  ModalBody,
  ModalFooter,
  ButtonSize,
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
import FormComboField, {
  FormComboFieldOption,
} from '../../../ui/form-combo-field/form-combo-field';
import { getCurrentChainId, getNameSources } from '../../../../selectors';
import {
  setName as saveName,
  updateProposedNames,
} from '../../../../store/actions';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { useName } from '../../../../hooks/useName';
import { useDisplayName } from '../../../../hooks/useDisplayName';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePetnamesMetrics } from './metrics';

const UPDATE_DELAY = 1000 * 2; // 2 Seconds

export type NameDetailsProps = {
  onClose: () => void;
  sourcePriority?: string[];
  type: NameType;
  value: string;
};

type ProposedNameOption = Required<FormComboFieldOption> & {
  sourceId: string;
};

function formatValue(value: string, type: NameType): string {
  switch (type) {
    case NameType.ETHEREUM_ADDRESS:
      return toChecksumAddress(value);

    default:
      return value;
  }
}

// Provider source ids that have a localized name:
const LOCALIZED_PROVIDERS = ['ens', 'etherscan', 'lens', 'token'];
// The following lines avoid i18n "unused messages" lint error.
// t('nameProvider_ens');
// t('nameProvider_etherscan');
// t('nameProvider_lens');
// t('nameProvider_token');

function getProviderLabel(
  sourceId: string,
  t: ReturnType<typeof useI18nContext>,
  nameSources: NameControllerState['nameSources'],
) {
  if (LOCALIZED_PROVIDERS.includes(sourceId)) {
    // Use intermediate variable to avoid "Forbidden use of template strings
    // in 't' function" error.
    const messageKey = `nameProvider_${sourceId}`;
    return t(messageKey);
  }
  return nameSources[sourceId]?.label ?? sourceId;
}

function generateComboOptions(
  proposedNameEntries: NameEntry['proposedNames'],
  t: ReturnType<typeof useI18nContext>,
  nameSources: NameControllerState['nameSources'],
): ProposedNameOption[] {
  const sourceIds = Object.keys(proposedNameEntries);

  const sourceIdsWithProposedNames = sourceIds.filter(
    (sourceId) => proposedNameEntries[sourceId]?.proposedNames?.length,
  );

  const options: ProposedNameOption[] = sourceIdsWithProposedNames
    .map((sourceId: string) => {
      const sourceProposedNames =
        proposedNameEntries[sourceId]?.proposedNames ?? [];

      return sourceProposedNames.map((proposedName: string) => ({
        value: proposedName,
        primaryLabel: t('nameModalMaybeProposedName', [proposedName]),
        secondaryLabel: t('nameProviderProposedBy', [
          getProviderLabel(sourceId, t, nameSources),
        ]),
        sourceId,
      }));
    })
    .flat();

  return options.sort((a, b) =>
    a.secondaryLabel
      .toLowerCase()
      .localeCompare(b.secondaryLabel.toLowerCase()),
  );
}

function getInitialSources(
  proposedNamesResult: Record<string, { proposedNames?: string[] }>,
  proposedNamesState: Record<string, { proposedNames?: string[] }>,
): string[] {
  const resultSources = Object.keys(proposedNamesResult).filter(
    (sourceId) => proposedNamesResult[sourceId].proposedNames?.length,
  );

  const stateSources = Object.keys(proposedNamesState).filter(
    (sourceId) =>
      !proposedNamesResult[sourceId]?.proposedNames &&
      proposedNamesState[sourceId].proposedNames?.length,
  );

  return [...resultSources, ...stateSources].sort();
}

function useProposedNames(value: string, type: NameType, chainId: string) {
  const dispatch = useDispatch();
  const { proposedNames } = useName(value, type);
  const updateInterval = useRef<any>();
  const [initialSources, setInitialSources] = useState<string[]>();

  useEffect(() => {
    const reset = () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };

    const update = async () => {
      const result = (await dispatch(
        updateProposedNames({
          value,
          type,
          onlyUpdateAfterDelay: true,
          variation: chainId,
        }),
      )) as any as UpdateProposedNamesResult;

      if (!initialSources) {
        setInitialSources(
          getInitialSources(result?.results ?? {}, proposedNames),
        );
      }
    };

    reset();
    update();

    updateInterval.current = setInterval(update, UPDATE_DELAY);
    return reset;
  }, [value, type, chainId, dispatch, initialSources, setInitialSources]);

  return { proposedNames, initialSources };
}

export default function NameDetails({
  onClose,
  type,
  value,
}: NameDetailsProps) {
  const chainId = useSelector(getCurrentChainId);
  const { name: savedPetname, sourceId: savedSourceId } = useName(value, type);
  const { name: displayName, hasPetname: hasSavedPetname } = useDisplayName(
    value,
    type,
  );
  const nameSources = useSelector(getNameSources, isEqual);
  const [name, setName] = useState('');
  const [openMetricSent, setOpenMetricSent] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [selectedSourceName, setSelectedSourceName] = useState<string>();
  const dispatch = useDispatch();
  const t = useI18nContext();

  const isRecognizedUnsaved = !hasSavedPetname && Boolean(displayName);
  const formattedValue = formatValue(value, type);

  const { proposedNames, initialSources } = useProposedNames(
    value,
    type,
    chainId,
  );

  const [copiedAddress, handleCopyAddress] = useCopyToClipboard() as [
    boolean,
    (value: string) => void,
  ];

  useEffect(() => {
    setName(savedPetname ?? '');
    setSelectedSourceId(savedSourceId ?? undefined);
    setSelectedSourceName(
      savedSourceId ? savedPetname ?? undefined : undefined,
    );
  }, [savedPetname, savedSourceId, setName, setSelectedSourceId]);

  const proposedNameOptions = useMemo(
    () => generateComboOptions(proposedNames, t, nameSources),
    [proposedNames, nameSources],
  );

  const { trackPetnamesOpenEvent, trackPetnamesSaveEvent } = usePetnamesMetrics(
    {
      initialSources,
      name,
      proposedNameOptions,
      savedName: savedPetname,
      savedSourceId,
      selectedSourceId,
      type,
    },
  );

  useEffect(() => {
    if (initialSources && !openMetricSent) {
      trackPetnamesOpenEvent();
      setOpenMetricSent(true);
    }
  }, [initialSources, openMetricSent, trackPetnamesOpenEvent]);

  const handleSaveClick = useCallback(async () => {
    trackPetnamesSaveEvent();

    await dispatch(
      saveName({
        value,
        type,
        name: name?.length ? name : null,
        sourceId: selectedSourceId,
        variation: chainId,
      }),
    );

    onClose();
  }, [name, selectedSourceId, onClose, trackPetnamesSaveEvent, chainId]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);

      if (newName !== selectedSourceName) {
        setSelectedSourceId(undefined);
        setSelectedSourceName(undefined);
      }
    },
    [setName, selectedSourceId, setSelectedSourceId, setSelectedSourceName],
  );

  const handleProposedNameClick = useCallback(
    (option: ProposedNameOption) => {
      setSelectedSourceId(option.sourceId);
      setSelectedSourceName(option.value);
    },
    [setSelectedSourceId, setSelectedSourceName],
  );

  const handleCopyClick = useCallback(() => {
    handleCopyAddress(formattedValue);
  }, [handleCopyAddress, formattedValue]);

  const [title, instructions] = (() => {
    if (hasSavedPetname) {
      return [t('nameModalTitleSaved'), t('nameInstructionsSaved')];
    }
    if (isRecognizedUnsaved) {
      return [t('nameModalTitleRecognized'), t('nameInstructionsRecognized')];
    }
    return [t('nameModalTitleNew'), t('nameInstructionsNew')];
  })();

  return (
    <Box>
      <Modal isOpen onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleClose}>{title}</ModalHeader>
          <ModalBody className="name-details__modal-body">
            <div
              style={{ textAlign: 'center', marginBottom: 16, marginTop: 8 }}
            >
              <Name
                value={value}
                type={NameType.ETHEREUM_ADDRESS}
                disableEdit
                internal
              />
            </div>
            <Text marginBottom={4} justifyContent={JustifyContent.spaceBetween}>
              {instructions}
            </Text>
            {/* @ts-ignore */}
            <FormTextField
              id="address"
              className="name-details__address"
              label={t('nameAddressLabel')}
              value={formattedValue}
              marginBottom={4}
              disabled
              endAccessory={
                <ButtonIcon
                  display={Display.Flex}
                  iconName={
                    copiedAddress ? IconName.CopySuccess : IconName.Copy
                  }
                  size={ButtonIconSize.Sm}
                  onClick={handleCopyClick}
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
                hideDropdownIfNoOptions
                value={name}
                options={proposedNameOptions}
                placeholder={t('nameSetPlaceholder')}
                onChange={handleNameChange}
                onOptionClick={handleProposedNameClick}
              />
            </Label>
          </ModalBody>
          <ModalFooter>
            <Button
              variant={ButtonVariant.Primary}
              startIconName={IconName.Save}
              width={BlockSize.Full}
              onClick={handleSaveClick}
              size={ButtonSize.Lg}
            >
              {t('save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
