import React from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { isSnapId } from '@metamask/snaps-utils';
import { Text, TextVariant } from '@metamask/design-system-react';

import {
  ConfirmInfoRow,
  ConfirmInfoRowDivider,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoRowAddress } from '../../../../../../../components/app/confirm/info/row/address';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRowUrl } from '../../../../../../../components/app/confirm/info/row/url';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import {
  getNativeTokenInfo,
  MetaMaskReduxState,
} from '../../../../../../../selectors';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useAsyncResult } from '../../../../../../../hooks/useAsync';
import { fetchErc20DecimalsOrThrow } from '../../../../../utils/token';
import { NetworkRow } from '../../shared/network-row/network-row';
import { SigningInWithRow } from '../../shared/sign-in-with-row/sign-in-with-row';

import type {
  AmountField,
  I18nFunction,
  I18nValue,
  PermissionRenderContext,
  PermissionSchemaEntry,
  SchemaElement,
  SchemaSection,
  TokenResolution,
  TotalExposureField,
} from './permission-detail-schema.types';
import { PERMISSION_SCHEMAS } from './permission-detail-schemas';
import { NativeAmountRow } from './native-amount-row';
import { TokenAmountRow } from './token-amount-row';
import { DateAndTimeRow } from './date-and-time-row';
import { Expiry } from './expiry';
import { TotalExposure } from './total-exposure';

// ---------------------------------------------------------------------------
// Hook wrappers — called unconditionally to satisfy React rules of hooks.
// Return meaningful data only when applicable based on tokenResolution.
// ---------------------------------------------------------------------------

function useNativeTokenData(
  chainId: Hex,
  resolution: TokenResolution,
): PermissionRenderContext['tokenInfo'] {
  const { symbol, decimals } = useSelector((state: MetaMaskReduxState) =>
    getNativeTokenInfo(state.metamask.networkConfigurationsByChainId, chainId),
  );
  const imageUrl = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId];

  if (resolution.kind !== 'native') {
    return undefined;
  }
  return { symbol, decimals, imageUrl };
}

function useErc20DecimalsResolved(
  permission: { data: Record<string, unknown> },
  chainId: Hex,
  resolution: TokenResolution,
): number | undefined {
  const tokenAddress =
    resolution.kind === 'erc20'
      ? resolution.getTokenAddress(permission)
      : undefined;

  const metadataResult = useAsyncResult(
    () =>
      tokenAddress
        ? fetchErc20DecimalsOrThrow(tokenAddress, chainId)
        : Promise.resolve(undefined),
    [tokenAddress, chainId],
  );

  if (resolution.kind !== 'erc20') {
    return undefined;
  }

  if (metadataResult.status === 'error') {
    throw metadataResult.error;
  }

  return metadataResult.value;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function translateValue(t: I18nFunction, value: I18nValue): string {
  return t(value.key, value.args);
}

// ---------------------------------------------------------------------------
// Element renderer — pure function, no hooks
// ---------------------------------------------------------------------------

function renderAmountField(
  element: AmountField,
  ctx: PermissionRenderContext,
  t: I18nFunction,
  index: number,
): React.ReactNode {
  // If the field has getTokenAddress, it's an ERC20 amount
  if (element.getTokenAddress) {
    return (
      <TokenAmountRow
        key={index}
        label={t(element.labelKey)}
        value={element.getValue(ctx)}
        tokenAddress={element.getTokenAddress(ctx)}
        chainId={ctx.chainId}
        decimals={ctx.tokenInfo?.decimals}
        tooltip={element.tooltip}
      />
    );
  }

  // Native token amount — tokenInfo is guaranteed to be set for native schemas
  const tokenInfo = ctx.tokenInfo as NonNullable<
    PermissionRenderContext['tokenInfo']
  >;
  return (
    <NativeAmountRow
      key={index}
      label={t(element.labelKey)}
      value={element.getValue(ctx)}
      symbol={tokenInfo.symbol}
      decimals={tokenInfo.decimals as number}
      imageUrl={tokenInfo.imageUrl}
      tooltip={element.tooltip}
    />
  );
}

function renderElement(
  element: SchemaElement,
  ctx: PermissionRenderContext,
  t: I18nFunction,
  schemaEntry: PermissionSchemaEntry,
  ownerId: string,
  index: number,
): React.ReactNode {
  // Check visibility predicate
  if ('visible' in element && element.visible && !element.visible(ctx)) {
    return null;
  }

  // Skip elements not intended for the confirmation view
  if ('views' in element && element.views && !element.views.includes('confirmation')) {
    return null;
  }

  switch (element.type) {
    case 'amount':
      return renderAmountField(element, ctx, t, index);

    case 'text': {
      return (
        <ConfirmInfoRow
          key={index}
          label={t(element.labelKey)}
          tooltip={element.tooltip}
        >
          <Text variant={TextVariant.BodyMd}>
            {translateValue(t, element.getValue(ctx))}
          </Text>
        </ConfirmInfoRow>
      );
    }

    case 'date': {
      return (
        <DateAndTimeRow
          key={index}
          timestamp={element.getTimestamp(ctx)}
          label={t(element.labelKey)}
          tooltip={element.tooltip}
        />
      );
    }

    case 'expiry': {
      return <Expiry key={index} expiry={ctx.expiry} />;
    }

    case 'totalExposure': {
      return renderTotalExposure(element, ctx, schemaEntry, index);
    }

    case 'divider': {
      return <ConfirmInfoRowDivider key={index} />;
    }

    case 'justification': {
      return (
        <ConfirmInfoRow
          key={index}
          label="Justification"
          tooltip={t('confirmFieldTooltipJustification')}
        >
          <Text variant={TextVariant.BodyMd}>
            {ctx.permission.justification}
          </Text>
        </ConfirmInfoRow>
      );
    }

    case 'account': {
      return <SigningInWithRow key={index} />;
    }

    case 'origin': {
      const tooltipMessage = isSnapId(ctx.origin)
        ? t('requestFromInfoSnap')
        : t('requestFromInfo');

      return (
        <ConfirmInfoAlertRow
          key={index}
          alertKey={RowAlertKey.RequestFrom}
          ownerId={ownerId}
          label={t('requestFrom')}
          tooltip={tooltipMessage}
        >
          <ConfirmInfoRowUrl url={ctx.origin} />
        </ConfirmInfoAlertRow>
      );
    }

    case 'address': {
      const address = element.getAddress(ctx);
      if (!address) {
        return null;
      }
      return (
        <ConfirmInfoRow key={index} label={t(element.labelKey)}>
          <ConfirmInfoRowAddress address={address} chainId={ctx.chainId} />
        </ConfirmInfoRow>
      );
    }

    case 'network': {
      return <NetworkRow key={index} />;
    }

    default:
      return null;
  }
}

function renderTotalExposure(
  element: TotalExposureField,
  ctx: PermissionRenderContext,
  schemaEntry: PermissionSchemaEntry,
  index: number,
): React.ReactNode {
  const streamParams = element.getStreamParams(ctx);

  if (schemaEntry.tokenVariant === 'native') {
    const tokenInfo = ctx.tokenInfo as NonNullable<
      PermissionRenderContext['tokenInfo']
    >;
    return (
      <TotalExposure
        key={index}
        variant="native"
        initialAmount={streamParams.initialAmount}
        maxAmount={streamParams.maxAmount}
        amountPerSecond={streamParams.amountPerSecond}
        startTime={streamParams.startTime}
        expiry={ctx.expiry}
        symbol={tokenInfo.symbol}
        decimals={tokenInfo.decimals as number}
        imageUrl={tokenInfo.imageUrl}
      />
    );
  }

  const { data } = ctx.permission;
  return (
    <TotalExposure
      key={index}
      variant="erc20"
      initialAmount={streamParams.initialAmount}
      maxAmount={streamParams.maxAmount}
      amountPerSecond={streamParams.amountPerSecond}
      startTime={streamParams.startTime}
      expiry={ctx.expiry}
      tokenAddress={data.tokenAddress as Hex}
      chainId={ctx.chainId}
      decimals={ctx.tokenInfo?.decimals}
    />
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function renderSection(
  section: SchemaSection,
  ctx: PermissionRenderContext,
  t: I18nFunction,
  schemaEntry: PermissionSchemaEntry,
  ownerId: string,
): React.ReactNode {
  return (
    <ConfirmInfoSection key={section.testId} data-testid={section.testId}>
      {section.elements.map((element, index) =>
        renderElement(element, ctx, t, schemaEntry, ownerId, index),
      )}
    </ConfirmInfoSection>
  );
}

// ---------------------------------------------------------------------------
// Main renderer component
// ---------------------------------------------------------------------------

export const PermissionDetailRenderer: React.FC<{
  permission: {
    type: string;
    data: Record<string, unknown>;
    justification?: string;
  };
  expiry: number | null;
  chainId: Hex;
  origin: string;
  to?: string;
  ownerId: string;
}> = ({ permission, expiry, chainId, origin, to, ownerId }) => {
  const t = useI18nContext() as I18nFunction;

  const schemaEntry = PERMISSION_SCHEMAS[permission.type];
  if (!schemaEntry) {
    throw new Error('Invalid permission type');
  }

  if (schemaEntry.validate) {
    schemaEntry.validate(permission);
  }

  const nativeToken = useNativeTokenData(chainId, schemaEntry.tokenResolution);
  const erc20Decimals = useErc20DecimalsResolved(
    permission,
    chainId,
    schemaEntry.tokenResolution,
  );

  // Build tokenInfo from whichever resolution path is active
  let tokenInfo: PermissionRenderContext['tokenInfo'];
  if (nativeToken) {
    tokenInfo = nativeToken;
  } else if (erc20Decimals === undefined) {
    tokenInfo = undefined;
  } else {
    tokenInfo = { symbol: '', decimals: erc20Decimals };
  }

  const ctx: PermissionRenderContext = {
    permission,
    expiry,
    chainId,
    origin,
    to,
    tokenInfo,
  };

  return (
    <>
      {schemaEntry.sections.map((section) =>
        renderSection(section, ctx, t, schemaEntry, ownerId),
      )}
    </>
  );
};
