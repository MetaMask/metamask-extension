import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  BoxFlexDirection,
  BoxJustifyContent,
  TextColor,
  TextAlign,
  TextVariant,
  Box,
  BoxAlignItems,
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import { PERMISSION_SCHEMAS } from '../../../../../../shared/lib/gator-permissions/permission-detail-schemas';
import type {
  AmountField,
  ExpiryField,
  FieldView,
  I18nFunction,
  I18nValue,
  PermissionRenderContext,
  SchemaElement,
  SchemaSection,
} from '../../../../../../shared/lib/gator-permissions/permission-detail-schema.types';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import type { GatorTokenInfo } from '../../../../../hooks/gator-permissions/useGatorPermissionTokenInfo';
import {
  convertTimestampToReadableDate,
  extractExpiryToReadableDate,
  formatDecimalShiftedValue,
  GatorPermissionRule,
} from '../../../../../../shared/lib/gator-permissions';
import { getImageForChainId } from '../../../../../selectors/multichain';
import { getInternalAccountByAddress } from '../../../../../selectors';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { PreferredAvatar } from '../../../../app/preferred-avatar';
import { CopyIcon } from '../../../../app/confirm/info/row/copy-icon';
import {
  GatorPermissionDetailRow,
  gatorPermissionDetailRowStyle,
} from './gator-permission-detail-row';

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatHexAmount(
  hexValue: Hex,
  decimals: number | undefined,
  symbol: string,
): string {
  const formatted = formatDecimalShiftedValue(hexValue, decimals);
  const suffix = typeof decimals === 'number' ? '' : ' (raw units)';
  return `${formatted} ${symbol}${suffix}`;
}

function formatRawAmount(
  rawValue: import('bignumber.js').BigNumber,
  decimals: number | undefined,
  symbol: string,
): string {
  const hexValue = `0x${rawValue.toString(16)}` as Hex;
  return formatHexAmount(hexValue, decimals, symbol);
}

function schemaElementDomKey(
  sectionTestId: string,
  element: SchemaElement,
  index: number,
): string {
  if (
    element.type === 'amount' ||
    element.type === 'text' ||
    element.type === 'date' ||
    element.type === 'address' ||
    element.type === 'expiry' ||
    element.type === 'justification' ||
    element.type === 'account' ||
    element.type === 'origin'
  ) {
    return `${sectionTestId}-${element.type}-${element.labelKey}`;
  }
  return `${sectionTestId}-${element.type}-${index}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function translateValue(t: I18nFunction, value: I18nValue): string {
  return t(value.key, value.args);
}

// ---------------------------------------------------------------------------
// Custom field components (use hooks, so must be React components)
// ---------------------------------------------------------------------------

const ReviewAccountRow: React.FC<{ address: string }> = ({ address }) => {
  const t = useI18nContext() as I18nFunction;
  const internalAccount = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );
  const accountText = useMemo(
    () => internalAccount?.metadata?.name || shortenAddress(address),
    [internalAccount, address],
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      style={gatorPermissionDetailRowStyle}
      gap={4}
      marginTop={2}
    >
      <Text
        textAlign={TextAlign.Left}
        color={TextColor.TextAlternative}
        variant={TextVariant.BodyMd}
      >
        {t('account')}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
        style={gatorPermissionDetailRowStyle}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        <PreferredAvatar address={address} />
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="review-gator-permission-account-name"
        >
          {accountText}
        </Text>
        <CopyIcon
          copyText={address}
          style={{ position: 'static', right: 'auto', top: 'auto' }}
        />
      </Box>
    </Box>
  );
};

const ReviewNetworkRow: React.FC<{
  chainId: Hex;
  networkName: string;
}> = ({ chainId, networkName }) => {
  const t = useI18nContext() as I18nFunction;

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      style={gatorPermissionDetailRowStyle}
      gap={4}
      marginTop={2}
    >
      <Text
        textAlign={TextAlign.Left}
        color={TextColor.TextAlternative}
        variant={TextVariant.BodyMd}
      >
        {t('networks')}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Baseline}
        justifyContent={BoxJustifyContent.End}
        style={gatorPermissionDetailRowStyle}
        gap={2}
      >
        <AvatarNetwork
          src={getImageForChainId(chainId)}
          name={chainId}
          size={AvatarNetworkSize.Xs}
        />
        <Text
          textAlign={TextAlign.Right}
          color={TextColor.TextAlternative}
          variant={TextVariant.BodyMd}
          data-testid="review-gator-permission-network-name"
        >
          {networkName}
        </Text>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Element renderer
// ---------------------------------------------------------------------------

type RenderElementOptions = {
  sectionTestId: string;
  element: SchemaElement;
  ctx: PermissionRenderContext;
  t: I18nFunction;
  tokenSymbol: string;
  tokenDecimals: number | undefined;
  isLoading: boolean;
  index: number;
  viewMode: FieldView;
  extraProps: {
    permissionAccount?: string;
    networkName?: string;
  };
  rules?: GatorPermissionRule[] | null;
};

function renderElement({
  sectionTestId,
  element,
  ctx,
  t,
  tokenSymbol,
  tokenDecimals,
  isLoading: loading,
  index,
  viewMode,
  extraProps,
  rules,
}: RenderElementOptions): React.ReactNode {
  // Skip elements not intended for the current view
  if (!element.includeInViews.includes(viewMode)) {
    return null;
  }

  const rowKey = schemaElementDomKey(sectionTestId, element, index);

  if ('isVisible' in element && !element.isVisible(ctx)) {
    return null;
  }

  switch (element.type) {
    case 'amount':
      return renderAmountElement(
        rowKey,
        element,
        ctx,
        t,
        tokenSymbol,
        tokenDecimals,
        loading,
      );

    case 'text':
      return (
        <GatorPermissionDetailRow
          key={rowKey}
          label={t(element.labelKey)}
          value={translateValue(t, element.getValue(ctx))}
          testId={element.testId}
        />
      );

    case 'date':
      return (
        <GatorPermissionDetailRow
          key={rowKey}
          label={t(element.labelKey)}
          value={convertTimestampToReadableDate(element.getValue(ctx) ?? 0)}
          testId={element.testId}
        />
      );

    case 'expiry':
      return renderExpiryElement(rowKey, element, ctx, t, rules);

    case 'justification':
      return element.getValue(ctx) ? (
        <GatorPermissionDetailRow
          key={rowKey}
          label={t(element.labelKey)}
          value={element.getValue(ctx) as string}
          testId={element.testId}
        />
      ) : null;

    case 'account':
      return extraProps.permissionAccount ? (
        <ReviewAccountRow key={rowKey} address={extraProps.permissionAccount} />
      ) : null;

    case 'network':
      return extraProps.networkName ? (
        <ReviewNetworkRow
          key={rowKey}
          chainId={ctx.chainId}
          networkName={extraProps.networkName}
        />
      ) : null;

    case 'totalExposure':
    case 'divider':
    case 'origin':
    case 'address':
      return null;

    default:
      return null;
  }
}

function renderAmountElement(
  rowKey: string,
  element: AmountField,
  ctx: PermissionRenderContext,
  t: I18nFunction,
  tokenSymbol: string,
  tokenDecimals: number | undefined,
  loading: boolean,
): React.ReactNode {
  const rawValue = element.getValue(ctx);
  let displayValue = formatRawAmount(rawValue, tokenDecimals, tokenSymbol);

  if (element.isRatePerSecond) {
    displayValue = `${displayValue}/sec`;
  }

  return (
    <GatorPermissionDetailRow
      key={rowKey}
      label={t(element.labelKey)}
      value={displayValue}
      testId={element.testId}
      isLoading={loading}
    />
  );
}

function renderExpiryElement(
  rowKey: string,
  element: ExpiryField,
  ctx: PermissionRenderContext,
  t: I18nFunction,
  rules?: GatorPermissionRule[] | null,
): React.ReactNode {
  let displayValue: string;
  if (rules?.length) {
    const expiryDate = extractExpiryToReadableDate(rules);
    displayValue = expiryDate || t('gatorPermissionNoExpiration');
  } else {
    const expiry = element.getValue(ctx);
    displayValue =
      expiry === null
        ? t('gatorPermissionNoExpiration')
        : convertTimestampToReadableDate(expiry);
  }

  return (
    <GatorPermissionDetailRow
      key={rowKey}
      label={t(element.labelKey)}
      value={displayValue}
      testId={element.testId}
    />
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

type RenderSectionOptions = {
  section: SchemaSection;
  ctx: PermissionRenderContext;
  t: I18nFunction;
  tokenSymbol: string;
  tokenDecimals: number | undefined;
  isLoading: boolean;
  viewMode: FieldView;
  extraProps: {
    permissionAccount?: string;
    networkName?: string;
  };
  rules?: GatorPermissionRule[] | null;
};

function renderSection({
  section,
  ctx,
  t,
  tokenSymbol,
  tokenDecimals,
  isLoading,
  viewMode,
  extraProps,
  rules,
}: RenderSectionOptions): React.ReactNode {
  return (
    <React.Fragment key={section.testId}>
      {section.elements.map((element, index) =>
        renderElement({
          sectionTestId: section.testId,
          element,
          ctx,
          t,
          tokenSymbol,
          tokenDecimals,
          isLoading,
          index,
          viewMode,
          extraProps,
          rules,
        }),
      )}
    </React.Fragment>
  );
}

// ---------------------------------------------------------------------------
// Main renderer component
// ---------------------------------------------------------------------------

export type ReviewPermissionRendererProps = {
  permissionType: string;
  permissionData: Record<string, unknown>;
  chainId: Hex;
  expiry: number | null;
  rules?: GatorPermissionRule[] | null;
  tokenInfo: Pick<GatorTokenInfo, 'symbol' | 'decimals'>;
  tokenLoading: boolean;
  /** Which view to filter fields by. Defaults to 'reviewDetail'. */
  viewMode?: 'reviewDetail' | 'reviewSummary';
  /** Account address for rendering account fields. */
  permissionAccount?: string;
  /** Network name for rendering network fields. */
  networkName?: string;
};

/**
 * Review-page renderer that interprets the shared permission schema.
 * Renders each schema element as a detail row with string-formatted values.
 * Does not run schema `validate` (signing flow only); tolerates imperfect stored data.
 * @param options0
 * @param options0.permissionType
 * @param options0.permissionData
 * @param options0.chainId
 * @param options0.expiry
 * @param options0.rules
 * @param options0.tokenInfo
 * @param options0.tokenLoading
 * @param options0.viewMode
 * @param options0.permissionAccount
 * @param options0.networkName
 */
export const ReviewPermissionRenderer: React.FC<
  ReviewPermissionRendererProps
> = ({
  permissionType,
  permissionData,
  chainId,
  expiry,
  rules,
  tokenInfo,
  tokenLoading: loading,
  viewMode = 'reviewDetail',
  permissionAccount,
  networkName,
}) => {
  const t = useI18nContext() as I18nFunction;

  const schemaEntry = PERMISSION_SCHEMAS[permissionType];
  if (!schemaEntry) {
    return null;
  }

  const ctx: PermissionRenderContext = {
    permission: {
      type: permissionType,
      data: permissionData,
      justification: permissionData.justification as string | undefined,
    },
    expiry,
    chainId,
    origin: '',
    tokenInfo: {
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
    },
  };

  const extraProps = { permissionAccount, networkName };

  return (
    <>
      {schemaEntry.sections.map((section) =>
        renderSection({
          section,
          ctx,
          t,
          tokenSymbol: tokenInfo.symbol,
          tokenDecimals: tokenInfo.decimals,
          isLoading: loading,
          viewMode,
          extraProps,
          rules,
        }),
      )}
    </>
  );
};
