import React from 'react';
import type { Hex } from '@metamask/utils';
import { PERMISSION_SCHEMAS } from '../../../../../../shared/lib/gator-permissions/permission-detail-schemas';
import type {
  AmountField,
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
import { GatorPermissionDetailRow } from './gator-permission-detail-row';

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
    element.type === 'address'
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
// Element renderer
// ---------------------------------------------------------------------------

function renderElement(
  sectionTestId: string,
  element: SchemaElement,
  ctx: PermissionRenderContext,
  t: I18nFunction,
  tokenSymbol: string,
  tokenDecimals: number | undefined,
  loading: boolean,
  index: number,
  rules?: GatorPermissionRule[] | null,
): React.ReactNode {
  // Skip elements not intended for the review detail view
  if (
    'views' in element &&
    element.views &&
    !element.views.includes('reviewDetail')
  ) {
    return null;
  }

  const rowKey = schemaElementDomKey(sectionTestId, element, index);

  if ('isVisible' in element && element.isVisible && !element.isVisible(ctx)) {
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
          label={t(element.reviewLabelKey ?? element.labelKey)}
          value={translateValue(t, element.getValue(ctx))}
          testId={element.reviewTestId}
        />
      );

    case 'date':
      return (
        <GatorPermissionDetailRow
          key={rowKey}
          label={t(element.reviewLabelKey ?? element.labelKey)}
          value={convertTimestampToReadableDate(element.getTimestamp(ctx) ?? 0)}
          testId={element.reviewTestId}
        />
      );

    case 'expiry':
      return renderExpiryElement(rowKey, ctx, t, element.reviewTestId, rules);

    case 'totalExposure':
    case 'divider':
    case 'justification':
    case 'account':
    case 'origin':
    case 'address':
    case 'network':
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
      label={t(element.reviewLabelKey ?? element.labelKey)}
      value={displayValue}
      testId={element.reviewTestId}
      isLoading={loading}
    />
  );
}

function renderExpiryElement(
  rowKey: string,
  ctx: PermissionRenderContext,
  t: I18nFunction,
  testId: string | undefined,
  rules?: GatorPermissionRule[] | null,
): React.ReactNode {
  let displayValue: string;
  if (rules?.length) {
    const expiryDate = extractExpiryToReadableDate(rules);
    displayValue = expiryDate || t('gatorPermissionNoExpiration');
  } else if (ctx.expiry === null) {
    displayValue = t('gatorPermissionNoExpiration');
  } else {
    displayValue = convertTimestampToReadableDate(ctx.expiry);
  }

  return (
    <GatorPermissionDetailRow
      key={rowKey}
      label={t('gatorPermissionsExpirationDate')}
      value={displayValue}
      testId={testId}
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
  tokenSymbol: string,
  tokenDecimals: number | undefined,
  loading: boolean,
  rules?: GatorPermissionRule[] | null,
): React.ReactNode {
  return (
    <React.Fragment key={section.testId}>
      {section.elements.map((element, index) =>
        renderElement(
          section.testId,
          element,
          ctx,
          t,
          tokenSymbol,
          tokenDecimals,
          loading,
          index,
          rules,
        ),
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
}) => {
  const t = useI18nContext() as I18nFunction;

  const schemaEntry = PERMISSION_SCHEMAS[permissionType];
  if (!schemaEntry) {
    return null;
  }

  const ctx: PermissionRenderContext = {
    permission: { type: permissionType, data: permissionData },
    expiry,
    chainId,
    origin: '',
    tokenInfo: {
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
    },
  };

  return (
    <>
      {schemaEntry.sections.map((section) =>
        renderSection(
          section,
          ctx,
          t,
          tokenInfo.symbol,
          tokenInfo.decimals,
          loading,
          rules,
        ),
      )}
    </>
  );
};
