import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Text } from '../../../component-library';
import { SnapUIRenderer } from '../snap-ui-renderer';
import {
  getSnapMetadata,
  getMemoizedUnapprovedConfirmations,
  getMemoizedUnapprovedTemplatedConfirmations,
} from '../../../../selectors';
import { SnapDelineator } from '../snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import {
  BackgroundColor,
  BlockSize,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Copyable } from '../copyable';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { deleteInterface } from '../../../../store/actions';
import {
  CONFIRMATION_V_NEXT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
} from '../../../../helpers/constants/routes';
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
  const navigate = useNavigate();

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
      navigate(`${CONFIRMATION_V_NEXT_ROUTE}/${templatedSnapApproval.id}`);
    } else if (snapApproval) {
      navigate(`${CONFIRM_TRANSACTION_ROUTE}/${snapApproval.id}`);
    }
  }, [unapprovedTemplatedConfirmations, unapprovedConfirmations, navigate]);

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
