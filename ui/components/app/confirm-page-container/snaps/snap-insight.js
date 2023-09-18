import React, {
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  useEffect,
  ///: END:ONLY_INCLUDE_IN
} from 'react';

import PropTypes from 'prop-types';

import {
  useSelector,
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  useDispatch,
  ///: END:ONLY_INCLUDE_IN
} from 'react-redux';
import Preloader from '../../../ui/icon/preloader/preloader-icon.component';
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
import { SnapUIRenderer } from '../../snaps/snap-ui-renderer';
import { SnapDelineator } from '../../snaps/snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { getSnapName } from '../../../../helpers/utils/util';
import { Copyable } from '../../snaps/copyable';
import { getTargetSubjectMetadata } from '../../../../selectors';
///: BEGIN:ONLY_INCLUDE_IN(build-flask)
import { trackInsightSnapUsage } from '../../../../store/actions';
///: END:ONLY_INCLUDE_IN

export const SnapInsight = ({ data, loading }) => {
  const t = useI18nContext();
  const {
    error,
    snapId,
    response: { content },
  } = data;
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  const dispatch = useDispatch();

  useEffect(() => {
    const trackInsightUsage = async () => {
      await dispatch(trackInsightSnapUsage(snapId));
    };
    trackInsightUsage();
  }, [snapId, dispatch]);
  ///: END:ONLY_INCLUDE_IN

  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const snapName = getSnapName(snapId, targetSubjectMetadata);

  const hasNoData =
    !error &&
    (loading || !content || (content && Object.keys(content).length === 0));
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
      {!loading && !error && (
        <Box
          height="full"
          flexDirection={FLEX_DIRECTION.COLUMN}
          className="snap-insight__container"
        >
          {data && Object.keys(data).length > 0 ? (
            <SnapUIRenderer
              snapId={snapId}
              data={content}
              delineatorType={DelineatorType.Insights}
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
          <SnapDelineator snapName={snapName} type={DelineatorType.Error}>
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
   * The insight object
   */
  data: PropTypes.object,
  /*
   * Boolean as to whether or not the insights are loading
   */
  loading: PropTypes.bool,
};
