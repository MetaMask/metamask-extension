import React, { useEffect } from 'react';

import PropTypes from 'prop-types';

import { useSelector, useDispatch } from 'react-redux';
import { Text } from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
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
import { trackInsightSnapUsage } from '../../../../store/actions';

export const SnapInsight = ({ snapId, data }) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const isLoading = data?.loading;
  const error = data?.error;
  const interfaceId = data?.interfaceId;

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
              contentBackgroundColor={BackgroundColor.backgroundDefault}
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
            <Copyable text={error} />
          </SnapDelineator>
        </Box>
      )}
    </Box>
  );
};

SnapInsight.propTypes = {
  /**
   * The snap id
   */
  snapId: PropTypes.string,
  /*
   * The insight object
   */
  data: PropTypes.object,
  /*
   * Boolean as to whether or not the insights are loading
   */
  loading: PropTypes.bool,
};
