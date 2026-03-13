import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { deleteInterface } from '../../../../store/actions';
import { Box, Text } from '../../../component-library';
import {
  BackgroundColor,
  BlockSize,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';
import { getSnapMetadata } from '../../../../selectors';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { Copyable } from '../copyable';
import { SnapUIRenderer } from '../snap-ui-renderer';
import { useSnapSettings } from '../../../../hooks/snaps/useSnapSettings';

export const SnapSettingsRenderer = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const t = useI18nContext();

  const snapId = searchParams.get('snapId');

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const { data, error, loading } = useSnapSettings({
    snapId,
  });

  const interfaceId = !loading && !error ? data?.id : undefined;

  useEffect(() => {
    return () => {
      interfaceId && dispatch(deleteInterface(interfaceId));
    };
  }, [interfaceId, dispatch]);

  if (!snapId) {
    return null;
  }

  return (
    <Box
      height={BlockSize.Full}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      {error && (
        <Box height={BlockSize.Full} padding={4}>
          <SnapDelineator snapName={snapName} type={DelineatorType.Error}>
            <Text variant={TextVariant.bodySm} marginBottom={4}>
              {t('snapsUIError', [<b key="0">{snapName}</b>])}
            </Text>
            <Copyable text={error.message} />
          </SnapDelineator>
        </Box>
      )}
      {/* TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880 */}
      {}
      {(interfaceId || loading) && (
        <SnapUIRenderer
          snapId={snapId}
          interfaceId={interfaceId}
          isLoading={loading}
          contentBackgroundColor={BackgroundColor.backgroundDefault}
        />
      )}
    </Box>
  );
};
