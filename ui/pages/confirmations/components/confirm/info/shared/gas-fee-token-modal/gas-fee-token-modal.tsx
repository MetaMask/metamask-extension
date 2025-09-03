import React, { useCallback, useState } from 'react';
import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
import classnames from 'classnames';

import { NATIVE_TOKEN_ADDRESS } from '../../../../../../../../shared/constants/transaction';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../../../../context/confirm';
import { GasFeeTokenListItem } from '../gas-fee-token-list-item';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { updateSelectedGasFeeToken } from '../../../../../../../store/controller-actions/transaction-controller';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { useIsInsufficientBalance } from '../../../../../hooks/useIsInsufficientBalance';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function GasFeeTokenModal({ onClose }: { onClose?: () => void }) {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { isSmartTransaction } = useIsGaslessSupported();

  const hasInsufficientNative = useIsInsufficientBalance();

  const {
    id: transactionId,
    gasFeeTokens,
    selectedGasFeeToken,
  } = currentConfirmation;

  const hasFutureNativeToken =
    isSmartTransaction &&
    hasInsufficientNative &&
    Boolean(
      gasFeeTokens?.some(
        (token) => token.tokenAddress === NATIVE_TOKEN_ADDRESS,
      ),
    );

  const [futureNativeSelected, setFutureNativeSelected] = useState(
    hasFutureNativeToken && Boolean(selectedGasFeeToken),
  );

  const gasFeeTokenAddresses =
    gasFeeTokens
      ?.filter((token) => token.tokenAddress !== NATIVE_TOKEN_ADDRESS)
      .map((token) => token.tokenAddress) ?? [];

  const hasGasFeeTokens = gasFeeTokenAddresses.length > 0;

  const handleTokenClick = useCallback(
    async (token: GasFeeToken) => {
      const selectedAddress =
        token.tokenAddress === NATIVE_TOKEN_ADDRESS && !futureNativeSelected
          ? undefined
          : token.tokenAddress;

      await updateSelectedGasFeeToken(transactionId, selectedAddress);

      onClose?.();
    },
    [futureNativeSelected, onClose, transactionId],
  );

  return (
    <Modal
      isOpen={true}
      onClose={
        onClose ??
        (() => {
          // Intentionally empty
        })
      }
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
    >
      <ModalOverlay data-testid="modal-overlay" />
      <ModalContent size={ModalContentSize.Md}>
        <ModalHeader onClose={onClose}>
          {t('confirmGasFeeTokenModalTitle')}
        </ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={0}
          paddingRight={0}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            marginInline={4}
          >
            <Title text={t('confirmGasFeeTokenModalPayETH')} noMargin />
            {hasFutureNativeToken && (
              <NativeToggle
                isFuture={futureNativeSelected}
                onChange={setFutureNativeSelected}
              />
            )}
          </Box>
          <GasFeeTokenListItem
            tokenAddress={
              futureNativeSelected ? NATIVE_TOKEN_ADDRESS : undefined
            }
            isSelected={
              !selectedGasFeeToken ||
              selectedGasFeeToken?.toLowerCase() === NATIVE_TOKEN_ADDRESS
            }
            onClick={handleTokenClick}
            warning={
              hasInsufficientNative &&
              !futureNativeSelected &&
              t('confirmGasFeeTokenInsufficientBalance')
            }
          />
          {hasGasFeeTokens && (
            <Title text={t('confirmGasFeeTokenModalPayToken')} />
          )}
          {gasFeeTokenAddresses.map((tokenAddress) => (
            <GasFeeTokenListItem
              key={tokenAddress}
              tokenAddress={tokenAddress}
              isSelected={
                selectedGasFeeToken?.toLowerCase() ===
                tokenAddress.toLowerCase()
              }
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleTokenClick}
            />
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function Title({ noMargin, text }: { noMargin?: boolean; text: string }) {
  return (
    <Text
      variant={TextVariant.bodySm}
      color={TextColor.textAlternative}
      marginLeft={noMargin ? 0 : 4}
      marginTop={3}
      marginBottom={3}
    >
      {text}
    </Text>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function NativeToggle({
  isFuture,
  onChange,
}: {
  isFuture?: boolean;
  onChange: (isFuture: boolean) => void;
}) {
  const t = useI18nContext();

  return (
    <Box
      data-testid="native-toggle"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      borderStyle={BorderStyle.solid}
      borderColor={BorderColor.borderMuted}
      borderRadius={BorderRadius.MD}
    >
      <NativeToggleOption
        isSelected={!isFuture}
        onClick={() => {
          onChange(false);
        }}
        tooltip={t('confirmGasFeeTokenModalNativeToggleWallet')}
      >
        <Icon
          name={IconName.Wallet}
          size={IconSize.Sm}
          color={
            isFuture ? IconColor.iconAlternativeSoft : IconColor.infoDefault
          }
          margin={2}
        />
      </NativeToggleOption>
      <NativeToggleOption
        isSelected={isFuture}
        onClick={() => {
          onChange(true);
        }}
        tooltip={t('confirmGasFeeTokenModalNativeToggleMetaMask')}
      >
        <img
          src="./images/logo/metamask-fox.svg"
          height={15}
          style={{
            margin: 8,
          }}
        />
      </NativeToggleOption>
    </Box>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function NativeToggleOption({
  children,
  isSelected,
  onClick,
  tooltip,
}: {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <Box
      display={Display.Flex}
      backgroundColor={isSelected ? BackgroundColor.primaryMuted : undefined}
      borderRadius={BorderRadius.MD}
      onClick={onClick}
      className={classnames('gas-fee-token-native-toggle-option', {
        'gas-fee-token-native-toggle-option--selected': isSelected ?? false,
      })}
    >
      <Tooltip
        title={tooltip}
        wrapperStyle={{ display: 'flex' }}
        style={{ display: 'flex' }}
        position="bottom"
      >
        {children}
      </Tooltip>
    </Box>
  );
}
