import React from 'react';
import PropTypes from 'prop-types';

import { useSelector } from 'react-redux';
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
import { SnapUIRenderer } from '../../flask/snap-ui-renderer';
import { SnapDelineator } from '../../flask/snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/flask';
import { getSnapName } from '../../../../helpers/utils/util';
import { Copyable } from '../../flask/copyable';
import { getTargetSubjectMetadata } from '../../../../selectors';

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

  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, selectedSnap.id),
  );

  const snapName = getSnapName(selectedSnap.id, targetSubjectMetadata);

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
            <SnapUIRenderer
              snapId={selectedSnap.id}
              data={data}
              delineatorType={DelineatorType.insights}
            />
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
        <Box padding={4} className="snap-insight__container__error">
          <SnapDelineator snapName={snapName} type={DelineatorType.error}>
            <Text variant={TextVariant.bodySm} marginBottom={4}>
              {t('snapsUIError', [<b key="0">{snapName}</b>])}
            </Text>
            <Copyable text={error.message} />
          </SnapDelineator>
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
