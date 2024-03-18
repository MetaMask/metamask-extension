import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Text } from '../../../component-library';
import { SnapUIRenderer } from '../snap-ui-renderer';
import { getSnapMetadata } from '../../../../selectors';
import { SnapDelineator } from '../snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { Copyable } from '../copyable';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { deleteInterface } from '../../../../store/actions';
import { useSnapHome } from './useSnapHome';

export const SnapHomeRenderer = ({ snapId }) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const { data, error, loading } = useSnapHome({ snapId });

  const interfaceId = !loading && !error ? data?.id : undefined;

  useEffect(() => {
    return () => interfaceId && dispatch(deleteInterface(interfaceId));
  }, [interfaceId]);

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
      {(interfaceId || loading) && (
        <SnapUIRenderer
          snapId={snapId}
          interfaceId={interfaceId}
          isLoading={loading}
        />
      )}
    </Box>
  );
};

SnapHomeRenderer.propTypes = {
  snapId: PropTypes.string,
};
