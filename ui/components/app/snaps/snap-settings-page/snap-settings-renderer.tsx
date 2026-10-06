import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { deleteInterface } from '../../../../store/actions';
import { Box } from '../../../component-library/box/box';
import { Text } from '../../../component-library/text/text';
import {
  BackgroundColor,
  BlockSize,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator/snap-delineator';
import { getSnapMetadata } from '../../../../selectors/selectors';
import { DelineatorType } from '../../../../helpers/constants/snaps/delineator';
import { Copyable } from '../copyable/copyable';
import { SnapUIRenderer } from '../snap-ui-renderer/snap-ui-renderer';
import { useSnapSettings } from '../../../../hooks/snaps/useSnapSettings';
import { useDispatch } from '../../../../store/hooks';

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
