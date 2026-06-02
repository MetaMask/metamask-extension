import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Toast,
  Icon,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import { selectErrorToast } from '../../../ducks/rewards/selectors';
import { setErrorToast } from '../../../ducks/rewards';
import React, { useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RewardsErrorToast() {
  const { isOpen, title, description, actionText, onActionClick } =
    useSelector(selectErrorToast);
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    dispatch(
      setErrorToast({
        isOpen: false,
        title,
        description,
        actionText,
        onActionClick,
      }),
    );
  }, [actionText, description, dispatch, onActionClick, title]);

  if (!isOpen) {
    return null;
  }

  return (
    <Box data-testid="rewards-error-toast">
      <Toast
        startAccessory={<Icon name={IconName.Danger} color={IconColor.ErrorDefault} />}
        title={title}
        description={description}
        actionButtonLabel={actionText}
        actionButtonOnClick={onActionClick}
        onClose={handleClose}
      />
    </Box>
  );
}
