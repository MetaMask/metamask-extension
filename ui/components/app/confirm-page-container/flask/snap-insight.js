import React from 'react';
import PropTypes from 'prop-types';

import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import Typography from '../../../ui/typography/typography';
import {
  ALIGN_ITEMS,
  COLORS,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTransactionInsightSnap } from '../../../../hooks/flask/useTransactionInsightSnap';
import Box from '../../../ui/box/box';
import ActionableMessage from '../../../ui/actionable-message/actionable-message';
import { SnapUIRenderer } from '../../flask/snap-ui-renderer';

export const SnapInsight = ({ transaction, origin, chainId, selectedSnap }) => {
  const t = useI18nContext();
  const {
    data: response,
    error,
    loading,
  } = useTransactionInsightSnap({
    transaction,
    chainId,
    origin,
    snapId: selectedSnap.id,
  });

  const data = response?.content;

  const hasNoData =
    !error && (loading || !data || (data && Object.keys(data).length === 0));
  return (
    <Box
      flexDirection={FLEX_DIRECTION.COLUMN}
      height="full"
      marginTop={hasNoData && 12}
      marginBottom={hasNoData && 12}
      alignItems={hasNoData && ALIGN_ITEMS.CENTER}
      justifyContent={hasNoData && JUSTIFY_CONTENT.CENTER}
      textAlign={hasNoData && TEXT_ALIGN.CENTER}
      className="snap-insight"
    >
      {!loading && !error && (
        <Box
          height="full"
          flexDirection={FLEX_DIRECTION.COLUMN}
          className="snap-insight__container"
        >
          {data && Object.keys(data).length > 0 ? (
            <SnapUIRenderer snapId={selectedSnap.id} data={data} />
          ) : (
            <Typography color={COLORS.TEXT_ALTERNATIVE} variant={TYPOGRAPHY.H6}>
              {t('snapsNoInsight')}
            </Typography>
          )}
        </Box>
      )}

      {!loading && error && (
        <Box
          paddingTop={0}
          paddingRight={6}
          paddingBottom={3}
          paddingLeft={6}
          className="snap-insight__container__error"
        >
          <ActionableMessage
            message={t('snapsInsightError', [
              selectedSnap.manifest.proposedName,
              error.message,
            ])}
            type="danger"
            useIcon
            iconFillColor="var(--color-error-default)"
          />
        </Box>
      )}

      {loading && (
        <>
          <Preloader size={40} />
          <Typography
            marginTop={3}
            color={COLORS.TEXT_ALTERNATIVE}
            variant={TYPOGRAPHY.H6}
          >
            {t('snapsInsightLoading')}
          </Typography>
        </>
      )}
    </Box>
  );
};

SnapInsight.propTypes = {
  /*
   * The transaction data object
   */
  transaction: PropTypes.object,
  /*
   * CAIP2 Chain ID
   */
  chainId: PropTypes.string,
  /*
   *  The origin of the transaction
   */
  origin: PropTypes.string,
  /*
   * The insight snap selected
   */
  selectedSnap: PropTypes.object,
};
