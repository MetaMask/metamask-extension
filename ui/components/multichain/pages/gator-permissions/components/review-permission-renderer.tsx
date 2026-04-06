import React from 'react';
import type { Hex } from '@metamask/utils';
import { PERMISSION_SCHEMAS } from '../../../../../../shared/lib/gator-permissions/permission-detail-schemas';
import type {
  AmountField,
  I18nFunction,
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
// Mapping from schema labelKeys to review-page i18n keys and testIds
// ---------------------------------------------------------------------------

type ReviewFieldMapping = {
  labelKey: string;
  testId: string;
  /** If true, append "/sec" to the formatted amount. */
  isRatePerSecond?: boolean;
};

/**
 * Maps schema field labelKeys to review-page-specific labels and testIds.
 * Fields not listed here are omitted on the review page (see comments below).
 */
const REVIEW_FIELD_MAP: Record<string, ReviewFieldMapping> = {
  confirmFieldInitialAllowance: {
    labelKey: 'gatorPermissionsInitialAllowance',
    testId: 'review-gator-permission-initial-allowance',
  },
  confirmFieldMaxAllowance: {
    labelKey: 'gatorPermissionsMaxAllowance',
    testId: 'review-gator-permission-max-allowance',
  },
  confirmFieldStartDate: {
    labelKey: 'gatorPermissionsStartDate',
    testId: 'review-gator-permission-start-date',
  },
  confirmFieldStreamRate: {
    labelKey: 'gatorPermissionsStreamRate',
    testId: 'review-gator-permission-stream-rate',
    isRatePerSecond: true,
  },
  // confirmFieldAllowance, confirmFieldFrequency, confirmFieldAvailablePerDay:
  // shown in the collapsed summary or skipped on purpose.
};

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
  rawValue: Hex | import('bignumber.js').BigNumber,
  decimals: number | undefined,
  symbol: string,
): string {
  let hexValue: Hex;
  if (typeof rawValue === 'string') {
    hexValue = rawValue;
  } else {
    hexValue = `0x${rawValue.toString(16)}` as Hex;
  }
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
// Element renderer
// ---------------------------------------------------------------------------

function renderElement(
  sectionTestId: string,
  element: SchemaElement,
  ctx: PermissionRenderContext,
  tokenSymbol: string,
  tokenDecimals: number | undefined,
  loading: boolean,
  index: number,
  rules?: GatorPermissionRule[] | null,
): React.ReactNode {
  const rowKey = schemaElementDomKey(sectionTestId, element, index);

  if ('visible' in element && element.visible && !element.visible(ctx)) {
    return null;
  }

  switch (element.type) {
    case 'amount': {
      const mapping = REVIEW_FIELD_MAP[element.labelKey];
      if (!mapping) {
        return null;
      }
      return renderAmountElement(
        rowKey,
        element,
        ctx,
        tokenSymbol,
        tokenDecimals,
        loading,
      );
    }

    case 'text': {
      const mapping = REVIEW_FIELD_MAP[element.labelKey];
      if (!mapping) {
        return null;
      }
      return (
        <GatorPermissionDetailRow
          key={rowKey}
          label={ctx.t(mapping.labelKey)}
          value={element.getValue(ctx)}
          testId={mapping.testId}
        />
      );
    }

    case 'date': {
      const mapping = REVIEW_FIELD_MAP[element.labelKey];
      if (!mapping) {
        return null;
      }
      return (
        <GatorPermissionDetailRow
          key={rowKey}
          label={ctx.t(mapping.labelKey)}
          value={convertTimestampToReadableDate(element.getTimestamp(ctx) ?? 0)}
          testId={mapping.testId}
        />
      );
    }

    case 'expiry':
      return renderExpiryElement(rowKey, ctx, rules);

    case 'totalExposure':
    case 'divider':
    case 'justification':
    case 'signingInWith':
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
  tokenSymbol: string,
  tokenDecimals: number | undefined,
  loading: boolean,
): React.ReactNode {
  const mapping = REVIEW_FIELD_MAP[element.labelKey];
  const rawValue = element.getValue(ctx);
  let displayValue = formatRawAmount(rawValue, tokenDecimals, tokenSymbol);

  if (mapping?.isRatePerSecond) {
    displayValue = `${displayValue}/sec`;
  }

  return (
    <GatorPermissionDetailRow
      key={rowKey}
      label={ctx.t(mapping?.labelKey ?? element.labelKey)}
      value={displayValue}
      testId={mapping?.testId}
      isLoading={loading}
    />
  );
}

function renderExpiryElement(
  rowKey: string,
  ctx: PermissionRenderContext,
  rules?: GatorPermissionRule[] | null,
): React.ReactNode {
  let displayValue: string;
  if (rules?.length) {
    const expiryDate = extractExpiryToReadableDate(rules);
    displayValue = expiryDate || ctx.t('gatorPermissionNoExpiration');
  } else if (ctx.expiry === null) {
    displayValue = ctx.t('gatorPermissionNoExpiration');
  } else {
    displayValue = convertTimestampToReadableDate(ctx.expiry);
  }

  return (
    <GatorPermissionDetailRow
      key={rowKey}
      label={ctx.t('gatorPermissionsExpirationDate')}
      value={displayValue}
      testId="review-gator-permission-expiration-date"
    />
  );
}

// ---------------------------------------------------------------------------
// Section renderer
// ---------------------------------------------------------------------------

function renderSection(
  section: SchemaSection,
  ctx: PermissionRenderContext,
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
    t,
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
          tokenInfo.symbol,
          tokenInfo.decimals,
          loading,
          rules,
        ),
      )}
    </>
  );
};
