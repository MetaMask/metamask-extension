import React, { useCallback, useState } from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  FontWeight,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  FormTextField,
  FormTextFieldSize,
  Label,
  SelectButton,
  SelectButtonSize,
  TextFieldType,
} from '../../components/component-library';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
} from '../../helpers/constants/design-system';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getImageForChainId } from '../../selectors/multichain';
import { Content } from '../../components/multichain/pages/page';
import {
  CustomTokenImportNetworkSelector,
  type CustomTokenImportNetworkOption,
} from './custom-token-import-network-selector';

const CUSTOM_TOKEN_TEXT_FIELD_PROPS = {
  backgroundColor: BackgroundColor.backgroundMuted,
  borderColor: BorderColor.borderDefault,
  borderRadius: BorderRadius.XL,
};

export type CustomTokenImportFormProps = {
  networkName: string;
  selectedNetwork: string;
  networks: CustomTokenImportNetworkOption[];
  address: string;
  addressError: string | null;
  symbol: string;
  symbolError: string | null;
  decimals: string;
  decimalsError: string | null;
  warning: string | null;
  showSymbolAndDecimals: boolean;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  onSelectNetwork: (network: CustomTokenImportNetworkOption) => void;
  onAddressChange: (value: string) => void;
  onSymbolChange: (value: string) => void;
  onDecimalsChange: (value: string) => void;
  onSecurityLinkClick: () => void;
  onSubmit: () => void;
};

type SubmitBarProps = Pick<CustomTokenImportFormProps, 'onSubmit'> & {
  isDisabled: boolean;
  isLoading: boolean;
};

const CustomTokenWarningBanner = ({
  onSecurityLinkClick,
}: Pick<CustomTokenImportFormProps, 'onSecurityLinkClick'>) => {
  const t = useI18nContext();

  return (
    <BannerAlert
      severity={BannerAlertSeverity.Warning}
      data-testid="custom-token-import-warning"
    >
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        color={TextColor.WarningDefault}
      >
        {t('customTokenWarningInTokenDetectionNetwork', [
          <TextButton key="learn-scam-risk" asChild className="inline">
            <a
              href={ZENDESK_URLS.TOKEN_SAFETY_PRACTICES}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onSecurityLinkClick}
            >
              {t('learnScamRisk')}
            </a>
          </TextButton>,
        ])}
      </Text>
    </BannerAlert>
  );
};

const NetworkPickerField = ({
  networkName,
  selectedNetwork,
  onClick,
}: Pick<CustomTokenImportFormProps, 'networkName' | 'selectedNetwork'> & {
  onClick: () => void;
}) => {
  const t = useI18nContext();

  return (
    <Box>
      <Label htmlFor="custom-token-import-network" marginBottom={1}>
        {t('network')}
      </Label>
      <SelectButton
        as="button"
        id="custom-token-import-network"
        type="button"
        size={SelectButtonSize.Lg}
        isBlock
        backgroundColor={BackgroundColor.backgroundMuted}
        borderColor={BorderColor.borderDefault}
        borderRadius={BorderRadius.XL}
        startAccessory={
          <AvatarNetwork
            size={AvatarNetworkSize.Xs}
            className="rounded-md"
            src={getImageForChainId(selectedNetwork) || undefined}
            name={networkName}
          />
        }
        onClick={onClick}
        data-testid="network-selector"
      >
        {networkName}
      </SelectButton>
    </Box>
  );
};

const TokenFormFields = ({
  address,
  addressError,
  symbol,
  symbolError,
  decimals,
  decimalsError,
  warning,
  showSymbolAndDecimals,
  onAddressChange,
  onSymbolChange,
  onDecimalsChange,
}: Pick<
  CustomTokenImportFormProps,
  | 'address'
  | 'addressError'
  | 'symbol'
  | 'symbolError'
  | 'decimals'
  | 'decimalsError'
  | 'warning'
  | 'showSymbolAndDecimals'
  | 'onAddressChange'
  | 'onSymbolChange'
  | 'onDecimalsChange'
>) => {
  const t = useI18nContext();

  return (
    <>
      <FormTextField
        id="custom-token-import-address"
        label={t('tokenContractAddress')}
        labelProps={{ marginBottom: 1 }}
        size={FormTextFieldSize.Lg}
        placeholder={t('enterTokenAddress')}
        value={address}
        error={Boolean(addressError)}
        helpText={addressError ?? undefined}
        textFieldProps={CUSTOM_TOKEN_TEXT_FIELD_PROPS}
        inputProps={{
          'data-testid': 'custom-token-import-address-input',
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onAddressChange(event.target.value)
        }
      />

      {warning ? (
        <BannerAlert
          severity={BannerAlertSeverity.Warning}
          data-testid="custom-token-import-mainnet-warning"
        >
          <Text variant={TextVariant.BodySm}>{warning}</Text>
        </BannerAlert>
      ) : null}

      {showSymbolAndDecimals ? (
        <>
          <FormTextField
            id="custom-token-import-symbol"
            label={t('tokenSymbol')}
            labelProps={{ marginBottom: 1 }}
            size={FormTextFieldSize.Lg}
            value={symbol}
            error={Boolean(symbolError)}
            helpText={symbolError ?? undefined}
            textFieldProps={CUSTOM_TOKEN_TEXT_FIELD_PROPS}
            inputProps={{
              'data-testid': 'custom-token-import-symbol-input',
            }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onSymbolChange(event.target.value)
            }
          />
          <FormTextField
            id="custom-token-import-decimal"
            label={t('tokenDecimal')}
            labelProps={{ marginBottom: 1 }}
            size={FormTextFieldSize.Lg}
            type={TextFieldType.Number}
            value={decimals}
            error={Boolean(decimalsError)}
            helpText={decimalsError ?? undefined}
            textFieldProps={CUSTOM_TOKEN_TEXT_FIELD_PROPS}
            inputProps={{
              'data-testid': 'custom-token-import-decimal-input',
            }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onDecimalsChange(event.target.value)
            }
          />
        </>
      ) : null}
    </>
  );
};

const SubmitBar = ({ isDisabled, isLoading, onSubmit }: SubmitBarProps) => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      padding={4}
      paddingBottom={6}
      className="bg-background-default"
    >
      <Button
        isFullWidth
        size={ButtonSize.Lg}
        data-testid="custom-token-import-submit-button"
        isDisabled={isDisabled}
        isLoading={isLoading}
        onClick={onSubmit}
        className="flex-1 rounded-xl"
      >
        {t('addToken')}
      </Button>
    </Box>
  );
};

export const CustomTokenImportForm = ({
  networkName,
  selectedNetwork,
  networks,
  address,
  addressError,
  symbol,
  symbolError,
  decimals,
  decimalsError,
  warning,
  showSymbolAndDecimals,
  isSubmitDisabled,
  isSubmitting,
  onSelectNetwork,
  onAddressChange,
  onSymbolChange,
  onDecimalsChange,
  onSecurityLinkClick,
  onSubmit,
}: CustomTokenImportFormProps) => {
  const [isNetworkSelectorOpen, setIsNetworkSelectorOpen] = useState(false);

  const closeNetworkSelector = useCallback(
    () => setIsNetworkSelectorOpen(false),
    [],
  );

  const handleSelectNetwork = useCallback(
    (network: CustomTokenImportNetworkOption) => {
      onSelectNetwork(network);
      setIsNetworkSelectorOpen(false);
    },
    [onSelectNetwork],
  );

  return (
    <Content padding={0}>
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="flex min-h-0 w-full flex-1 flex-col justify-between"
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          padding={4}
          gap={6}
          className="flex flex-1 flex-col overflow-auto min-h-0"
        >
          <CustomTokenWarningBanner onSecurityLinkClick={onSecurityLinkClick} />
          <NetworkPickerField
            networkName={networkName}
            selectedNetwork={selectedNetwork}
            onClick={() => setIsNetworkSelectorOpen(true)}
          />
          <TokenFormFields
            address={address}
            addressError={addressError}
            symbol={symbol}
            symbolError={symbolError}
            decimals={decimals}
            decimalsError={decimalsError}
            warning={warning}
            showSymbolAndDecimals={showSymbolAndDecimals}
            onAddressChange={onAddressChange}
            onSymbolChange={onSymbolChange}
            onDecimalsChange={onDecimalsChange}
          />
        </Box>

        <SubmitBar
          isDisabled={isSubmitDisabled}
          isLoading={isSubmitting}
          onSubmit={onSubmit}
        />
      </Box>

      <CustomTokenImportNetworkSelector
        isOpen={isNetworkSelectorOpen}
        networks={networks}
        selectedNetwork={selectedNetwork}
        onBack={closeNetworkSelector}
        onClose={closeNetworkSelector}
        onSelectNetwork={handleSelectNetwork}
      />
    </Content>
  );
};
