import { useDispatch, useSelector } from 'react-redux';
import React, { useCallback } from 'react';
import { Box } from '@metamask/design-system-react';
import { Icon, IconName } from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';
import { selectErrorToast } from '../../../ducks/rewards/selectors';
import { setErrorToast } from '../../../ducks/rewards';
import { Toast } from '../../multichain/toast/toast';

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
        startAdornment={
          <Icon name={IconName.Danger} color={IconColor.errorDefault} />
        }
        text={title}
        description={description}
        actionText={actionText}
        onActionClick={onActionClick}
        onClose={handleClose}
      />
    </Box>
  );
}
