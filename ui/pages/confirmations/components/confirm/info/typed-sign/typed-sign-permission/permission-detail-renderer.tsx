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

import {
  computeTotalExposureForPermission,
  isPermissionDataWithTotalExposure,
} from '../../../../../../../../shared/lib/gator-permissions/compute-total-exposure';
import {
  PERMISSION_SCHEMAS,
  assertPermissionSchemaEntry,
} from '../../../../../../../../shared/lib/gator-permissions/permission-detail-schemas';
import { throwUnhandledPermissionSchemaElement } from '../../../../../../../../shared/lib/gator-permissions/throw-unhandled-permission-schema-element';
import { translateI18nValue } from '../../../../../../../../shared/lib/gator-permissions/translate-i18n-value';
import type {
  AmountField,
  DeepNonNullable,
  I18nFunction,
  PermissionRenderContext,
  SchemaElement,
  SchemaSection,
  TokenResolution,
} from '../../../../../../../../shared/lib/gator-permissions/permission-detail-schema.types';
import { NativeAmountRow } from './native-amount-row';
import { TokenAmountRow } from './token-amount-row';
import { DateAndTimeRow } from './date-and-time-row';
import { Expiry } from './expiry';

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
  const tokenInfo = ctx.tokenInfo as DeepNonNullable<
    PermissionRenderContext['tokenInfo']
  >;
  return (
    <NativeAmountRow
      key={index}
      label={t(element.labelKey)}
      value={element.getValue(ctx)}
      symbol={tokenInfo.symbol}
      decimals={tokenInfo.decimals}
      imageUrl={tokenInfo.imageUrl}
      tooltip={element.tooltip}
    />
  );
}

function renderElement(
  element: SchemaElement,
  ctx: PermissionRenderContext,
  t: I18nFunction,
  ownerId: string,
  index: number,
): React.ReactNode {
  // Check visibility predicate
  if ('isVisible' in element && !element.isVisible(ctx)) {
    return null;
  }

  // Skip elements not intended for the confirmation view
  if (!element.includeInViews.includes('confirmation')) {
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
            {translateI18nValue(t, element.getValue(ctx))}
          </Text>
        </ConfirmInfoRow>
      );
    }

    case 'date': {
      return (
        <DateAndTimeRow
          key={index}
          timestamp={element.getValue(ctx)}
          label={t(element.labelKey)}
          tooltip={element.tooltip}
        />
      );
    }

    case 'expiry': {
      return <Expiry key={index} expiry={element.getValue(ctx)} />;
    }

    case 'divider': {
      return <ConfirmInfoRowDivider key={index} />;
    }

    case 'justification': {
      const justificationValue = element.getValue(ctx);
      const justificationText =
        typeof justificationValue === 'string'
          ? justificationValue
          : translateI18nValue(t, justificationValue);
      return (
        <ConfirmInfoRow
          key={index}
          label={t(element.labelKey)}
          tooltip={t('confirmFieldTooltipJustification')}
        >
          <Text variant={TextVariant.BodyMd}>{justificationText}</Text>
        </ConfirmInfoRow>
      );
    }

    case 'account': {
      return <SigningInWithRow key={index} />;
    }

    case 'origin': {
      const origin = ctx.origin ?? '';
      const tooltipMessage = isSnapId(origin)
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
          <ConfirmInfoRowUrl url={origin} />
        </ConfirmInfoAlertRow>
      );
    }

    case 'address': {
      const address = element.getValue(ctx);
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
      return throwUnhandledPermissionSchemaElement(element);
  }
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function renderSection(
  section: SchemaSection,
  ctx: PermissionRenderContext,
  t: I18nFunction,
  ownerId: string,
): React.ReactNode {
  const children = section.elements.map((element, index) =>
    renderElement(element, ctx, t, ownerId, index),
  );

  const hasContent = children.some(
    (child) => child !== null && child !== undefined && child !== false,
  );

  if (!hasContent) {
    return null;
  }

  return (
    <ConfirmInfoSection key={section.testId} data-testid={section.testId}>
      {children}
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
  // Use an explicit branch (not `?.`) so React Compiler output cannot read
  // `.tokenResolution` off an undefined schema entry during invalid types.
  const tokenResolution: TokenResolution =
    schemaEntry === undefined ? { kind: 'none' } : schemaEntry.tokenResolution;

  // Hooks must run before any code that can throw (invalid type / validate),
  // so hook order stays stable if permission data changes between renders.
  const nativeToken = useNativeTokenData(chainId, tokenResolution);
  const erc20Decimals = useErc20DecimalsResolved(
    permission,
    chainId,
    tokenResolution,
  );

  assertPermissionSchemaEntry(permission.type, schemaEntry);

  if (schemaEntry.validate) {
    schemaEntry.validate(permission);
  }

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
    ...(isPermissionDataWithTotalExposure(permission.data)
      ? {
          streamTotalExposure: computeTotalExposureForPermission(
            permission.data,
            expiry,
          ),
        }
      : {}),
  };

  return (
    <>
      {schemaEntry.sections.map((section) =>
        renderSection(section, ctx, t, ownerId),
      )}
    </>
  );
};
