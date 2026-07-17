import { useDispatch, useSelector } from 'react-redux';
import React, { useCallback, useEffect, useRef } from 'react';
import { useToasterStore } from 'react-hot-toast';
import { selectErrorToast } from '../../../ducks/rewards/selectors';
import { setErrorToast } from '../../../ducks/rewards';
import { toast } from '../../ui/toast/toast';

const TOAST_ID = 'rewards-error-toast';

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RewardsErrorToast() {
  const { isOpen, title, description, actionText, onActionClick } =
    useSelector(selectErrorToast);
  const dispatch = useDispatch();
  const { toasts } = useToasterStore();
  const isUpdatingToastRef = useRef(false);

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

  useEffect(() => {
    if (!isOpen) {
      toast.dismiss(TOAST_ID);
      return undefined;
    }

    isUpdatingToastRef.current = false;

    toast.error(
      {
        title: title,
        description: description,
        actionText: actionText,
        onActionClick: onActionClick,
        dataTestId: "rewards-error-toast",
        id: TOAST_ID,
      },
      {
        duration: Infinity,
      },
    );

    return () => {
      isUpdatingToastRef.current = true;
      toast.dismiss(TOAST_ID);
    };
  }, [isOpen, title, description, actionText, onActionClick]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const activeToast = toasts.find((item) => item.id === TOAST_ID);
    if (activeToast?.dismissed && !isUpdatingToastRef.current) {
      handleClose();
    }
  }, [toasts, isOpen, handleClose]);

  return null;
}
