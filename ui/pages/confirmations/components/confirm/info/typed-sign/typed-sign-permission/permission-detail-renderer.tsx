import React from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { Text, TextVariant } from '@metamask/design-system-react';

import {
  ConfirmInfoRow,
  ConfirmInfoRowDivider,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  getNativeTokenInfo,
  MetaMaskReduxState,
} from '../../../../../../../selectors';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useAsyncResult } from '../../../../../../../hooks/useAsync';
import { fetchErc20DecimalsOrThrow } from '../../../../../utils/token';

import type {
  I18nFunction,
  PermissionContext,
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
): PermissionContext['nativeToken'] {
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
// Element renderer — pure function, no hooks
// ---------------------------------------------------------------------------

function renderElement(
  element: SchemaElement,
  ctx: PermissionContext,
  index: number,
): React.ReactNode {
  // Check visibility predicate
  if ('visible' in element && element.visible && !element.visible(ctx)) {
    return null;
  }

  switch (element.type) {
    case 'nativeAmount': {
      const { symbol, decimals, imageUrl } = ctx.nativeToken!;
      return (
        <NativeAmountRow
          key={index}
          label={ctx.t(element.labelKey)}
          value={element.getValue(ctx)}
          symbol={symbol}
          decimals={decimals}
          imageUrl={imageUrl}
          tooltip={element.tooltip}
        />
      );
    }

    case 'tokenAmount': {
      return (
        <TokenAmountRow
          key={index}
          label={ctx.t(element.labelKey)}
          value={element.getValue(ctx)}
          tokenAddress={element.getTokenAddress(ctx)}
          chainId={ctx.chainId}
          decimals={ctx.erc20Decimals}
          tooltip={element.tooltip}
        />
      );
    }

    case 'text': {
      return (
        <ConfirmInfoRow
          key={index}
          label={ctx.t(element.labelKey)}
          tooltip={element.tooltip}
        >
          <Text variant={TextVariant.BodyMd}>{element.getValue(ctx)}</Text>
        </ConfirmInfoRow>
      );
    }

    case 'date': {
      return (
        <DateAndTimeRow
          key={index}
          timestamp={element.getTimestamp(ctx)}
          label={ctx.t(element.labelKey)}
          tooltip={element.tooltip}
        />
      );
    }

    case 'expiry': {
      return <Expiry key={index} expiry={ctx.expiry} />;
    }

    case 'totalExposure': {
      return renderTotalExposure(element, ctx, index);
    }

    case 'divider': {
      return <ConfirmInfoRowDivider key={index} />;
    }

    default:
      return null;
  }
}

function renderTotalExposure(
  element: TotalExposureField,
  ctx: PermissionContext,
  index: number,
): React.ReactNode {
  const streamParams = element.getStreamParams(ctx);

  if (element.variant === 'native') {
    const { symbol, decimals, imageUrl } = ctx.nativeToken!;
    return (
      <TotalExposure
        key={index}
        variant="native"
        initialAmount={streamParams.initialAmount}
        maxAmount={streamParams.maxAmount}
        amountPerSecond={streamParams.amountPerSecond}
        startTime={streamParams.startTime}
        expiry={ctx.expiry}
        symbol={symbol}
        decimals={decimals}
        imageUrl={imageUrl}
      />
    );
  }

  const data = ctx.permission.data;
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
      decimals={ctx.erc20Decimals}
    />
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function renderSection(
  section: SchemaSection,
  ctx: PermissionContext,
): React.ReactNode {
  return (
    <ConfirmInfoSection key={section.testId} data-testid={section.testId}>
      {section.elements.map((element, index) =>
        renderElement(element, ctx, index),
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
}> = ({ permission, expiry, chainId }) => {
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

  const ctx: PermissionContext = {
    permission,
    expiry,
    chainId,
    t,
    nativeToken,
    erc20Decimals,
  };

  return (
    <>
      {schemaEntry.sections.map((section) => renderSection(section, ctx))}
    </>
  );
};
