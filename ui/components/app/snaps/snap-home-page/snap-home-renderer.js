import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Box, Text } from '../../../component-library';
import { SnapUIRenderer } from '../snap-ui-renderer';
import { getTargetSubjectMetadata } from '../../../../selectors';
import { getSnapName } from '../../../../helpers/utils/util';
import { SnapDelineator } from '../snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { Copyable } from '../copyable';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSnapHome } from './useSnapHome';

export const SnapHomeRenderer = ({ snapId }) => {
  const t = useI18nContext();
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const snapName = getSnapName(snapId, targetSubjectMetadata);
  const { data, error, loading } = useSnapHome({ snapId });

  const content = !loading && !error && data?.content;

  return (
    <Box>
      {error && (
        <SnapDelineator snapName={snapName} type={DelineatorType.Error}>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            {t('snapsUIError', [<b key="0">{snapName}</b>])}
          </Text>
          <Copyable text={error.message} />
        </SnapDelineator>
      )}
      {(content || loading) && (
        <SnapUIRenderer snapId={snapId} data={content} isLoading={loading} />
      )}
    </Box>
  );
};

SnapHomeRenderer.propTypes = {
  snapId: PropTypes.string,
};
