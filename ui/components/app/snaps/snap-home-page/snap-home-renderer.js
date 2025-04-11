import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  BackgroundColor,
  BlockSize,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  CONFIRMATION_V_NEXT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
} from '../../../../helpers/constants/routes';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  getSnapMetadata,
  getMemoizedUnapprovedConfirmations,
  getMemoizedUnapprovedTemplatedConfirmations,
} from '../../../../selectors';
import { deleteInterface } from '../../../../store/actions';
import { Box, Text } from '../../../component-library';
import { Copyable } from '../copyable';
import { SnapDelineator } from '../snap-delineator';
import { SnapUIRenderer } from '../snap-ui-renderer';
import { useSnapHome } from './useSnapHome';

export const SnapHomeRenderer = ({ snapId }) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const unapprovedTemplatedConfirmations = useSelector(
    getMemoizedUnapprovedTemplatedConfirmations,
  );
  const unapprovedConfirmations = useSelector(
    getMemoizedUnapprovedConfirmations,
  );
  const history = useHistory();

  const { data, error, loading } = useSnapHome({ snapId });

  const interfaceId = !loading && !error ? data?.id : undefined;

  useEffect(() => {
    return () => interfaceId && dispatch(deleteInterface(interfaceId));
  }, [interfaceId]);

  useEffect(() => {
    // Snaps are allowed to redirect to their own pending confirmations (templated or not)
    const templatedSnapApproval = unapprovedTemplatedConfirmations.find(
      (approval) => approval.origin === snapId,
    );
    const snapApproval = unapprovedConfirmations.find(
      (approval) => approval.origin === snapId,
    );

    if (templatedSnapApproval) {
      history.push(`${CONFIRMATION_V_NEXT_ROUTE}/${templatedSnapApproval.id}`);
    } else if (snapApproval) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${snapApproval.id}`);
    }
  }, [unapprovedTemplatedConfirmations, unapprovedConfirmations, history]);

  if (error) {
    return (
      <Box
        height={BlockSize.Full}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundAlternative}
        style={{
          overflowY: 'auto',
        }}
      >
        <Box height={BlockSize.Full} padding={4}>
          <SnapDelineator snapName={snapName} type={DelineatorType.Error}>
            <Text variant={TextVariant.bodySm} marginBottom={4}>
              {t('snapsUIError', [<b key="0">{snapName}</b>])}
            </Text>
            <Copyable text={error.message} />
          </SnapDelineator>
        </Box>
      </Box>
    );
  }

  return (
    <SnapUIRenderer
      snapId={snapId}
      interfaceId={interfaceId}
      isLoading={loading}
      useFooter
    />
  );
};

SnapHomeRenderer.propTypes = {
  snapId: PropTypes.string,
};
