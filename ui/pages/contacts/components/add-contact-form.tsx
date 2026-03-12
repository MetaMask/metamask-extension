import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useContext,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import { addHexPrefix } from 'ethereumjs-util';
import { isHexString } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  FormTextField,
  FormTextFieldSize,
  SelectButton,
  SelectButtonSize,
  Label,
} from '../../../components/component-library';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { DomainInputResolutionCell } from '../../../components/multichain/domain-input-resolution-cell';
import { getImageForChainId } from '../../../selectors/multichain';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../shared/lib/selectors/networks';
import {
  addToAddressBook,
  showQrScanner,
  qrCodeDetected,
} from '../../../store/actions';
import { getQrCodeData } from '../../../ducks/app/app';
import {
  getDomainError,
  getDomainResolutions,
  resetDomainResolution,
  lookupDomainName,
  initializeDomainSlice,
} from '../../../ducks/domains';
import {
  getCompleteAddressBook,
  getInternalAccounts,
} from '../../../selectors';
import { isDuplicateContact } from '../../../components/app/contact-list/utils';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../shared/lib/hexstring-utils';
import { INVALID_RECIPIENT_ADDRESS_ERROR } from '../../confirmations/send-utils/send.constants';
import { isValidDomainName } from '../../../helpers/utils/util';
import type { AddContactFormProps } from '../contacts.types';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { ContactNetworks } from './contact-networks';

export function AddContactForm({ onCancel, onSuccess }: AddContactFormProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const addressBook = useSelector(getCompleteAddressBook);
  const internalAccounts = useSelector(getInternalAccounts);
  const qrCodeData = useSelector(getQrCodeData);
  const domainError = useSelector(getDomainError);
  const domainResolutions = useSelector(getDomainResolutions);
  const currentChainId = useSelector(getCurrentChainId);
  const networks = useSelector(getNetworkConfigurationsByChainId);

  const [newName, setNewName] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [addressInputError, setAddressInputError] = useState('');
  const [nameInputError, setNameInputError] = useState('');
  const [input, setInput] = useState('');
  const [enteredDomainName, setEnteredDomainName] = useState('');
  const [selectedChainId, setSelectedChainId] = useState<string>(
    typeof currentChainId === 'string' ? currentChainId : '',
  );
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const prevChainIdRef = useRef(selectedChainId);

  const validate = useCallback((value: string) => {
    const valid =
      !isBurnAddress(value) &&
      isValidHexAddress(value, { mixedCaseUseChecksum: true });
    const validEnsAddress = isValidDomainName(value);
    if (!validEnsAddress && !valid) {
      setAddressInputError(INVALID_RECIPIENT_ADDRESS_ERROR);
    } else {
      setAddressInputError('');
    }
  }, []);

  const dValidate = useMemo(() => debounce(validate, 500), [validate]);
  const dLookupDomain = useMemo(
    () =>
      debounce((name: string) => {
        dispatch(lookupDomainName(name, selectedChainId));
      }, 150),
    [dispatch, selectedChainId],
  );

  useEffect(() => {
    dispatch(initializeDomainSlice());
  }, [dispatch]);

  useEffect(() => {
    const domainToResolve = isValidDomainName(input)
      ? input
      : enteredDomainName;
    if (prevChainIdRef.current !== selectedChainId && domainToResolve) {
      setInput(domainToResolve);
      setEnteredDomainName('');
      dispatch(resetDomainResolution());
      dispatch(lookupDomainName(domainToResolve, selectedChainId));
    }
    prevChainIdRef.current = selectedChainId;
  }, [selectedChainId, enteredDomainName, input, dispatch]);

  useEffect(() => {
    if (qrCodeData?.type === 'address' && qrCodeData?.values?.address) {
      const scannedAddress = qrCodeData.values.address.toLowerCase();
      const addresses = [
        ...(domainResolutions?.map(
          (r: { resolvedAddress: string }) => r.resolvedAddress,
        ) ?? []),
        selectedAddress,
      ]
        .filter(Boolean)
        .map((addr: string) => addr.toLowerCase());
      if (!addresses.includes(scannedAddress)) {
        setInput(scannedAddress);
        validate(scannedAddress);
        dispatch(qrCodeDetected(null as never));
      }
    }
  }, [qrCodeData, domainResolutions, selectedAddress, validate, dispatch]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (
      name.trim() &&
      isDuplicateContact(addressBook, internalAccounts, name)
    ) {
      setNameInputError(t('nameAlreadyInUse'));
    } else {
      setNameInputError('');
    }
    setNewName(name);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setInput(value);
    dValidate(value);
    if (isHexString(value)) {
      dispatch(resetDomainResolution());
    } else if (isValidDomainName(value)) {
      dLookupDomain(value);
    }
  };

  const handleAddressPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    if (
      text &&
      !isBurnAddress(text) &&
      isValidHexAddress(text, { mixedCaseUseChecksum: true })
    ) {
      e.preventDefault();
      const normalized = addHexPrefix(text);
      setInput(normalized);
      validate(normalized);
    }
  };

  const handleAddressClearOrScan = () => {
    if (selectedAddress || input) {
      dispatch(resetDomainResolution());
      setInput('');
      setSelectedAddress('');
      setEnteredDomainName('');
    } else {
      trackEvent({
        category: MetaMetricsEventCategory.Contacts,
        event: MetaMetricsEventName.ContactAddQrScannerClicked,
        properties: { location: 'add_contact_form' },
      });
      dispatch(showQrScanner());
    }
  };

  const addressError = domainError || addressInputError;
  const newAddress = selectedAddress || input;
  const validAddress =
    !isBurnAddress(newAddress) &&
    isValidHexAddress(newAddress, { mixedCaseUseChecksum: true });
  const isSaveDisabled = Boolean(
    addressInputError || nameInputError || !validAddress || !newName.trim(),
  );

  const handleSubmit = async () => {
    await dispatch(
      addToAddressBook(
        newAddress,
        newName,
        '',
        typeof selectedChainId === 'string' ? selectedChainId : '',
      ),
    );
    trackEvent({
      category: MetaMetricsEventCategory.Contacts,
      event: MetaMetricsEventName.ContactAdded,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: typeof selectedChainId === 'string' ? selectedChainId : '',
      },
      sensitiveProperties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        contact_address: newAddress,
      },
    });
    onSuccess();
  };

  const selectedNetworkName: string =
    (networks && typeof selectedChainId === 'string'
      ? (networks as Record<string, { name?: string }>)[selectedChainId]?.name
      : undefined) ?? t('networkTabCustom');

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="flex min-h-0 w-full flex-1 flex-col justify-between"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        padding={4}
        gap={6}
        className="flex flex-1 flex-col overflow-auto min-h-0"
        style={{
          scrollbarColor: 'var(--color-icon-muted) transparent',
        }}
      >
        <FormTextField
          id="contact-nickname"
          label={t('nickname')}
          placeholder={t('addAlias')}
          value={newName}
          onChange={handleNameChange}
          error={Boolean(nameInputError)}
          helpText={nameInputError || undefined}
          size={FormTextFieldSize.Lg}
          labelProps={{ marginBottom: 1 }}
          autoFocus
          textFieldProps={{
            backgroundColor: BackgroundColor.backgroundMuted,
            borderColor: BorderColor.borderDefault,
            borderRadius: BorderRadius.XL,
          }}
        />

        <Box>
          <FormTextField
            id="contact-address"
            label={t('address')}
            placeholder={t('recipientAddressPlaceholderNew')}
            value={selectedAddress || input}
            onChange={handleAddressChange}
            error={Boolean(addressError)}
            helpText={addressError ? t(String(addressError)) : undefined}
            size={FormTextFieldSize.Lg}
            labelProps={{ marginBottom: 1 }}
            textFieldProps={{
              backgroundColor: BackgroundColor.backgroundMuted,
              borderColor: BorderColor.borderDefault,
              borderRadius: BorderRadius.XL,
            }}
            endAccessory={
              <ButtonIcon
                iconName={
                  selectedAddress || input ? IconName.Close : IconName.Scan
                }
                ariaLabel={t(selectedAddress || input ? 'close' : 'scanQrCode')}
                onClick={handleAddressClearOrScan}
                size={ButtonIconSize.Sm}
                data-testid="ens-qr-scan-button"
              />
            }
            inputProps={{ onPaste: handleAddressPaste }}
          />
          {domainResolutions?.length > 0 && (
            <Box marginTop={2}>
              {domainResolutions.map(
                (resolution: {
                  resolvedAddress: string;
                  resolvingSnap?: string;
                  addressBookEntryName?: string;
                  protocol?: string;
                  domainName?: string;
                }) => (
                  <DomainInputResolutionCell
                    key={`${resolution.resolvedAddress}-${resolution.protocol ?? ''}`}
                    address={resolution.resolvedAddress}
                    domainName={
                      resolution.addressBookEntryName ??
                      resolution.domainName ??
                      ''
                    }
                    onClick={() => {
                      const resolvedName = resolution.domainName ?? '';
                      setNewName(resolvedName);
                      setInput(resolution.resolvedAddress);
                      setSelectedAddress(resolution.resolvedAddress);
                      setEnteredDomainName(resolvedName);
                      dispatch(resetDomainResolution());

                      const isValidName = !isDuplicateContact(
                        addressBook,
                        internalAccounts,
                        resolvedName,
                      );
                      setNameInputError(
                        resolvedName && !isValidName
                          ? t('nameAlreadyInUse')
                          : '',
                      );
                      setAddressInputError('');
                    }}
                    protocol={resolution.protocol}
                    resolvingSnap={resolution.resolvingSnap}
                  />
                ),
              )}
            </Box>
          )}
        </Box>

        <Box>
          <Label marginBottom={1}>{t('network')}</Label>
          <SelectButton
            size={SelectButtonSize.Lg}
            isBlock
            backgroundColor={BackgroundColor.backgroundMuted}
            borderColor={BorderColor.borderDefault}
            borderRadius={BorderRadius.XL}
            startAccessory={
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                className="rounded-md"
                src={
                  typeof selectedChainId === 'string'
                    ? getImageForChainId(selectedChainId) || undefined
                    : undefined
                }
                name={String(selectedNetworkName)}
              />
            }
            onClick={() => setShowNetworkModal(true)}
            data-testid="network-selector"
          >
            {selectedNetworkName}
          </SelectButton>
        </Box>

        {showNetworkModal && (
          <ContactNetworks
            isOpen
            onClose={() => setShowNetworkModal(false)}
            selectedChainId={selectedChainId}
            onSelect={(chainId: string) => setSelectedChainId(String(chainId))}
          />
        )}
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={4}
        padding={4}
        paddingBottom={6}
        className="bg-background-default"
      >
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border-default"
          data-testid="page-container-footer-cancel"
        >
          {t('cancel')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isDisabled={isSaveDisabled}
          onClick={handleSubmit}
          className="flex-1 rounded-xl"
          data-testid="page-container-footer-next"
        >
          {t('save')}
        </Button>
      </Box>
    </Box>
  );
}
