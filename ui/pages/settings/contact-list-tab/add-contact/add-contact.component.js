import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { useSelector } from 'react-redux';
import TextField from '../../../../components/ui/text-field';
import { CONTACT_LIST_ROUTE } from '../../../../helpers/constants/routes';
import { isValidDomainName } from '../../../../helpers/utils/util';
import DomainInput from '../../../confirmations/send/send-content/add-recipient/domain-input';
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../../../../shared/modules/hexstring-utils';
import { INVALID_RECIPIENT_ADDRESS_ERROR } from '../../../confirmations/send/send.constants';
import { DomainInputResolutionCell } from '../../../../components/multichain/pages/send/components';
import { isDuplicateContact } from '../../../../components/app/contact-list/utils';
import { I18nContext } from '../../../../contexts/i18n';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { getImageForChainId } from '../../../../selectors/multichain';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../../../shared/modules/selectors/networks';
import { ContactNetworks } from '../contact-networks';

const AddContact = ({
  addressBook,
  internalAccounts,
  addToAddressBook,
  history,
  scanQrCode,
  qrCodeData,
  qrCodeDetected,
  domainResolutions,
  domainError,
  resetDomainResolution,
}) => {
  const t = useContext(I18nContext);

  const [newName, setNewName] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [addressInputError, setAddressInputError] = useState('');
  const [nameInputError, setNameInputError] = useState('');
  const [input, setInput] = useState('');
  const currentChainId = useSelector(getCurrentChainId);
  const [selectedChainId, setSelectedChainId] = useState(currentChainId);
  const [showModal, setShowModal] = useState(false);
  const networks = useSelector(getNetworkConfigurationsByChainId);

  const validate = useCallback((value) => {
    const valid =
      !isBurnAddress(value) &&
      isValidHexAddress(value, { mixedCaseUseChecksum: true });
    const validEnsAddress = isValidDomainName(value);

    if (!validEnsAddress && !valid) {
      setAddressInputError(INVALID_RECIPIENT_ADDRESS_ERROR);
    } else {
      setAddressInputError(null);
    }
  }, []);

  const dValidate = useMemo(() => debounce(validate, 500), [validate]);

  const handleNameChange = (name) => {
    const isValidName = !isDuplicateContact(
      addressBook,
      internalAccounts,
      name,
    );
    setNameInputError(isValidName ? null : t('nameAlreadyInUse'));
    setNewName(name);
  };

  const onChange = (value) => {
    setInput(value);
    dValidate(value);
  };

  const renderInput = () => (
    <DomainInput
      scanQrCode={() => scanQrCode()}
      onChange={onChange}
      onPaste={(value) => {
        setInput(value);
        validate(value);
      }}
      onReset={() => {
        resetDomainResolution();
        setInput('');
        setSelectedAddress('');
      }}
      userInput={selectedAddress || input}
    />
  );

  useEffect(() => {
    if (qrCodeData?.type === 'address') {
      const scannedAddress = qrCodeData.values.address.toLowerCase();
      const addresses = [
        ...domainResolutions.map(({ resolvedAddress }) => resolvedAddress),
        selectedAddress,
      ]
        .filter(Boolean)
        .map((addr) => addr.toLowerCase());

      if (!addresses.includes(scannedAddress)) {
        setInput(scannedAddress);
        validate(scannedAddress);
        qrCodeDetected(null);
      }
    }
  }, [
    qrCodeData,
    domainResolutions,
    selectedAddress,
    validate,
    qrCodeDetected,
  ]);

  const addressError = domainError || addressInputError;
  const newAddress = selectedAddress || input;
  const validAddress =
    !isBurnAddress(newAddress) &&
    isValidHexAddress(newAddress, { mixedCaseUseChecksum: true });

  return (
    <div className="settings-page__content-row address-book__add-contact">
      <div className="address-book__add-contact__content">
        <div className="address-book__view-contact__group address-book__add-contact__content__username">
          <div className="address-book__view-contact__group__label">
            {t('userName')}
          </div>
          <TextField
            type="text"
            id="nickname"
            placeholder={t('addAlias')}
            value={newName}
            onChange={(e) => handleNameChange(e.target.value)}
            fullWidth
            margin="dense"
            error={nameInputError}
          />
        </div>

        <div className="address-book__view-contact__group">
          <div className="address-book__view-contact__group__label">
            {t('ethereumPublicAddress')}
          </div>
          {renderInput()}
          <div
            className={`address-book__view-contact__group__${
              domainResolutions?.length === 1 ? 'single-' : ''
            }resolution-list`}
          >
            {domainResolutions?.map((resolution) => {
              const {
                resolvedAddress,
                resolvingSnap,
                addressBookEntryName,
                protocol,
                domainName,
              } = resolution;
              return (
                <DomainInputResolutionCell
                  key={`${resolvedAddress}${resolvingSnap}${protocol}`}
                  address={resolvedAddress}
                  domainName={addressBookEntryName ?? domainName}
                  onClick={() => {
                    handleNameChange(domainName);
                    setInput(resolvedAddress);
                    resetDomainResolution();
                  }}
                  protocol={protocol}
                  resolvingSnap={resolvingSnap}
                />
              );
            })}
          </div>
          {addressError && (
            <div className="address-book__add-contact__error">
              {t(addressError)}
            </div>
          )}
        </div>
        <div className="address-book__view-contact__group">
          <div className="address-book__view-contact__group__label">
            {t('network')}
          </div>
          <Box
            as="button"
            padding={3}
            display={Display.Flex}
            alignItems={AlignItems.center}
            backgroundColor={BackgroundColor.transparent}
            borderColor={BorderColor.borderDefault}
            justifyContent={JustifyContent.spaceBetween}
            borderRadius={BorderRadius.XL}
            onClick={() => setShowModal(true)}
            className="network-selector"
            data-testid="network-selector"
          >
            <Box display={Display.Flex} gap={2}>
              <AvatarNetwork
                size={AvatarNetworkSize.Sm}
                src={getImageForChainId(selectedChainId) || undefined}
                name={networks?.[selectedChainId]?.name}
              />
              <Text>{networks?.[selectedChainId]?.name}</Text>
            </Box>
            <Icon
              name={IconName.ArrowDown}
              color={IconColor.iconDefault}
              size={IconSize.Sm}
            />
          </Box>
          {showModal && (
            <ContactNetworks
              isOpen
              onClose={() => setShowModal(false)}
              selectedChainId={selectedChainId}
              onSelect={(chainname) => setSelectedChainId(chainname)}
            />
          )}
        </div>
      </div>
      <PageContainerFooter
        cancelText={t('cancel')}
        disabled={Boolean(
          addressInputError ||
            nameInputError ||
            !validAddress ||
            !newName.trim(),
        )}
        onSubmit={async () => {
          await addToAddressBook(newAddress, newName, '', selectedChainId);
          history.push(CONTACT_LIST_ROUTE);
        }}
        onCancel={() => {
          history.push(CONTACT_LIST_ROUTE);
        }}
        submitText={t('save')}
      />
    </div>
  );
};

AddContact.propTypes = {
  addressBook: PropTypes.array,
  internalAccounts: PropTypes.array,
  addToAddressBook: PropTypes.func,
  history: PropTypes.object,
  scanQrCode: PropTypes.func,
  qrCodeData: PropTypes.object,
  qrCodeDetected: PropTypes.func,
  domainResolutions: PropTypes.arrayOf(PropTypes.object),
  domainError: PropTypes.string,
  resetDomainResolution: PropTypes.func,
};

export default AddContact;
