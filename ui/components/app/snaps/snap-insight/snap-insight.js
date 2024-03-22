import React, { useEffect } from 'react';

import PropTypes from 'prop-types';

import { useSelector, useDispatch } from 'react-redux';
import { Text } from '../../../component-library';
import {
  AlignItems,
  FLEX_DIRECTION,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Box from '../../../ui/box/box';
import { SnapUIRenderer } from '../snap-ui-renderer';
import { SnapDelineator } from '../snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { Copyable } from '../copyable';
import { getSnapMetadata } from '../../../../selectors';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi,build-beta)
  deleteInterface,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  trackInsightSnapUsage,
  ///: END:ONLY_INCLUDE_IF
} from '../../../../store/actions';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi,build-beta)
import { useTransactionInsightSnaps } from '../../../../hooks/snaps/useTransactionInsightSnaps';
///: END:ONLY_INCLUDE_IF

export const SnapInsight = ({
  snapId,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  data,
  ///: END:ONLY_INCLUDE_IF
  loading,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi,build-beta)
  insightHookParams,
  ///: END:ONLY_INCLUDE_IF
}) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  let error, interfaceId;
  let isLoading = loading;
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  error = data?.error;
  interfaceId = data?.response?.id;
  useEffect(() => {
    const trackInsightUsage = async () => {
      try {
        await dispatch(trackInsightSnapUsage(snapId));
      } catch {
        /** no-op */
      }
    };
    trackInsightUsage();
  }, [snapId, dispatch]);
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi,build-beta)
  const insights = useTransactionInsightSnaps(insightHookParams);
  error = insights.data?.[0]?.error;
  interfaceId = insights.data?.[0]?.response?.id;
  isLoading = insights.loading;

  useEffect(() => {
    return () => {
      interfaceId && dispatch(deleteInterface(interfaceId));
    };
  }, [interfaceId]);
  ///: END:ONLY_INCLUDE_IF

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const hasNoData = !error && !isLoading && !interfaceId;

  return (
    <Box
      flexDirection={FLEX_DIRECTION.COLUMN}
      height="full"
      marginTop={hasNoData && 12}
      marginBottom={hasNoData && 12}
      alignItems={hasNoData && AlignItems.center}
      justifyContent={hasNoData && JustifyContent.center}
      textAlign={hasNoData && TextAlign.Center}
      className="snap-insight"
    >
      {!error && (
        <Box
          height="full"
          width="full"
          flexDirection={FLEX_DIRECTION.COLUMN}
          className="snap-insight__container"
        >
          {isLoading || interfaceId ? (
            <SnapUIRenderer
              snapId={snapId}
              interfaceId={interfaceId}
              delineatorType={DelineatorType.Insights}
              isLoading={isLoading}
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

      {!isLoading && error && (
        <Box padding={4} className="snap-insight__container__error">
          <SnapDelineator snapName={snapName} type={DelineatorType.Error}>
            <Text variant={TextVariant.bodySm} marginBottom={4}>
              {t('snapsUIError', [<b key="0">{snapName}</b>])}
            </Text>
            <Copyable text={error.message} />
          </SnapDelineator>
        </Box>
      )}
    </Box>
  );
};

SnapInsight.propTypes = {
  snapId: PropTypes.string,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  /*
   * The insight object
   */
  data: PropTypes.object,
  ///: END:ONLY_INCLUDE_IF
  /*
   * Boolean as to whether or not the insights are loading
   */
  loading: PropTypes.bool,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-mmi,build-beta)
  /**
   * Params object for the useTransactionInsightSnaps hook
   */
  insightHookParams: PropTypes.object,
  ///: END:ONLY_INCLUDE_IF
};
