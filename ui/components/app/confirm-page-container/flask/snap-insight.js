import React from 'react';
import PropTypes from 'prop-types';

import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
import { Text } from '../../../component-library';
import {
  AlignItems,
  FLEX_DIRECTION,
  JustifyContent,
  TEXT_ALIGN,
  TextColor,
  TextVariant,
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
      alignItems={hasNoData && AlignItems.center}
      justifyContent={hasNoData && JustifyContent.center}
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
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodySm}
              as="h6"
            >
              {t('snapsNoInsight')}
            </Text>
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
          <Text
            marginTop={3}
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            as="h6"
          >
            {t('snapsInsightLoading')}
          </Text>
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
