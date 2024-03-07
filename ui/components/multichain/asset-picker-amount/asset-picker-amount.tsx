import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Label,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  IconColor,
  TextColor,
  TextVariant,
  FontWeight,
  TextAlign,
  FlexDirection,
  JustifyContent,
  BlockSize,
} from '../../../helpers/constants/design-system';

import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import UserPreferencedCurrencyInput from '../../app/user-preferenced-currency-input/user-preferenced-currency-input.container';
import UserPreferencedTokenInput from '../../app/user-preferenced-token-input/user-preferenced-token-input.component';
import {
  Amount,
  Asset,
  getCurrentDraftTransaction,
  updateSendAmount,
} from '../../../ducks/send';
import { useI18nContext } from '../../../hooks/useI18nContext';
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display';
import { PRIMARY } from '../../../helpers/constants/common';
import TokenBalance from '../../ui/token-balance';
import { getSelectedInternalAccount } from '../../../selectors';
import UnitInput from '../../ui/unit-input/unit-input.component';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import MaxClearButton from './max-clear-button';
import AssetPicker from './asset-picker/asset-picker';

const renderCurrencyInput = (asset: Asset, amount: Amount) => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  if (asset.type === AssetType.native) {
    return (
      <>
        <UserPreferencedCurrencyInput
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: I'm not sure why the types don't find `onChange`
          onChange={(newAmount: string) =>
            dispatch(updateSendAmount(newAmount))
          }
          hexValue={amount.value}
          className="asset-picker-amount__input"
          swapIcon={(onClick: React.MouseEventHandler) => (
            <ButtonIcon
              backgroundColor={BackgroundColor.transparent}
              iconName={IconName.SwapVertical}
              ariaLabel={t('switchInputCurrency')}
              size={ButtonIconSize.Sm}
              color={IconColor.primaryDefault}
              onClick={onClick}
            />
          )}
        />
      </>
    );
  }
  if (
    asset.type === AssetType.NFT &&
    asset.details?.standard === TokenStandard.ERC721
  ) {
    return (
      <>
        <Box
          marginLeft={'auto'}
          textAlign={TextAlign.End}
          paddingTop={2}
          paddingBottom={2}
        >
          <Text variant={TextVariant.bodySm}>{t('tokenId')}</Text>
          <Text variant={TextVariant.bodySm} fontWeight={FontWeight.Bold}>
            {asset?.details?.tokenId}
          </Text>
        </Box>
      </>
    );
  }
  if (
    asset.type === AssetType.NFT &&
    asset.details?.standard === TokenStandard.ERC1155
  ) {
    return (
      <Box marginLeft={'auto'} textAlign={TextAlign.End} width={BlockSize.Max}>
        <Text variant={TextVariant.bodyMd} ellipsis>
          {t('amount')}
        </Text>
        <UnitInput
          onChange={(newAmount: string) =>
            dispatch(updateSendAmount(decimalToHex(newAmount)))
          }
          type="number"
          min="0"
          className="erc1155-input"
        ></UnitInput>
      </Box>
    );
  }

  return (
    <UserPreferencedTokenInput
      onChange={(newAmount: string) => dispatch(updateSendAmount(newAmount))}
      token={asset.details}
      value={amount.value}
      className="asset-picker-amount__input"
    />
  );
};

// A component that combines an asset picker with an input for the amount to send.
export const AssetPickerAmount = () => {
  const t = useI18nContext();
  const { asset, amount } = useSelector(getCurrentDraftTransaction);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const { error } = amount;

  const balanceColor = error
    ? TextColor.errorDefault
    : TextColor.textAlternative;

  const renderAssetDisplay = () => {
    if (asset.type === AssetType.native) {
      return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Other props are optional but the compiler expects them
        <UserPreferencedCurrencyDisplay
          value={asset.balance}
          type={PRIMARY}
          textProps={{
            color: balanceColor,
            variant: TextVariant.bodySm,
          }}
          suffixProps={{
            color: balanceColor,
            variant: TextVariant.bodySm,
          }}
        />
      );
    }
    if (
      asset.details?.standard === TokenStandard.ERC20 ||
      asset.details?.standard === TokenStandard.ERC721
    ) {
      return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Details should be defined for token assets
        <TokenBalance
          token={asset.details}
          textProps={{
            color: balanceColor,
            variant: TextVariant.bodySm,
          }}
          suffixProps={{
            color: balanceColor,
            variant: TextVariant.bodySm,
          }}
        />
      );
    } else if (asset.details?.standard === TokenStandard.ERC1155) {
      const {
        details: { balance },
      } = asset as any;
      return (
        <Text color={balanceColor} marginRight={1} variant={TextVariant.bodySm}>
          {balance}
        </Text>
      );
    }
    return null;
  };

  useEffect(() => {
    if (!asset) {
      throw new Error('No asset is drafted for sending');
    }
  }, [selectedAccount]);

  return (
    <Box className="asset-picker-amount">
      <Box display={Display.Flex}>
        <Label>
          {asset.type === AssetType.NFT ? t('asset') : t('amount')}:
        </Label>
        <MaxClearButton asset={asset} />
      </Box>
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        backgroundColor={BackgroundColor.backgroundDefault}
        paddingLeft={4}
        paddingRight={4}
        borderRadius={BorderRadius.LG}
        borderColor={
          error ? BorderColor.errorDefault : BorderColor.primaryDefault
        }
        borderStyle={BorderStyle.solid}
        borderWidth={2}
        marginTop={2}
        paddingTop={1}
        paddingBottom={1}
      >
        <AssetPicker asset={asset} />
        {renderCurrencyInput(asset, amount)}
      </Box>

      {asset.type === AssetType.NFT &&
      asset.details?.standard === TokenStandard.ERC1155 ? (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.flexStart}
            width={BlockSize.TwoThirds}
            gap={1}
          >
            <Text
              color={balanceColor}
              marginRight={1}
              variant={TextVariant.bodySm}
            >
              {t('balance')}: xx
            </Text>
            {renderAssetDisplay()}
            {error ? (
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.errorDefault}
                data-testid="send-page-amount-error"
              >
                . {t(error)}
              </Text>
            ) : null}
          </Box>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            width={BlockSize.OneThird}
            alignItems={AlignItems.flexEnd}
          >
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
              width={BlockSize.ThreeFourths}
              textAlign={TextAlign.End}
              ellipsis
            >
              ID: {`#${asset.details?.tokenId}`}
            </Text>
          </Box>
        </Box>
      ) : (
        <Box display={Display.Flex}>
          <Text
            color={balanceColor}
            marginRight={1}
            variant={TextVariant.bodySm}
          >
            {t('balance')}:
          </Text>
          {renderAssetDisplay()}
          {error ? (
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.errorDefault}
              data-testid="send-page-amount-error"
            >
              . {t(error)}
            </Text>
          ) : null}
        </Box>
      )}
    </Box>
  );
};
