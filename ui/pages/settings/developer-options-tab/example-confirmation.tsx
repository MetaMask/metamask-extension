import React, { useCallback, useEffect } from 'react';
import {
  Button,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import { requestUserApproval } from '../../../store/actions';
import { APPROVAL_TYPE_EXAMPLE } from '../../confirmations/external/example/components/example-info';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { useConfirmationNavigation } from '../../confirmations/hooks/useConfirmationNavigation';
import { useDispatch } from 'react-redux';
import { useApprovalRequest } from '../../confirmations/hooks/useApprovalRequest';

export function ExampleConfirmation() {
  const dispatch = useDispatch();
  const { navigateToIndex } = useConfirmationNavigation();
  const approvalRequest = useApprovalRequest();

  useEffect(() => {
    if (approvalRequest) {
      navigateToIndex(0);
    }
  }, [approvalRequest]);

  const handleClick = useCallback(() => {
    dispatch(
      requestUserApproval({
        type: APPROVAL_TYPE_EXAMPLE,
        origin: ORIGIN_METAMASK,
        requestData: { exampleField: 123 },
      }),
    );
  }, [dispatch]);

  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        Show an example confirmation using the modular architecture.
      </Text>
      <Button variant={ButtonVariant.Primary} onClick={handleClick}>
        Show Confirmation
      </Button>
    </>
  );
}
