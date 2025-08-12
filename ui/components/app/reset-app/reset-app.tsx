import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSignOut } from '../../../hooks/identity/useAuthentication';
import { Button, ButtonVariant } from '../../component-library';
import { getIsUnlocked } from '../../../ducks/metamask/metamask';
// import { getIsSocialLoginFlow } from '../../../selectors';
import { resetApp } from '../../../store/actions';
import { useHistory } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

export default function ResetAppButton() {
  const dispatch = useDispatch();
  const history = useHistory();
  const { signOut } = useSignOut();
  const isUnlocked = useSelector(getIsUnlocked);
  // const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const shouldBeDisabled = isUnlocked;


  const handleReset = async () => {
    await signOut();
    await dispatch(resetApp());
    history.replace(DEFAULT_ROUTE);
  }

  return (
    <Button
      type='button'
      data-testid="reset-app-button"
      variant={ButtonVariant.Primary}
      onClick={handleReset}
      disabled={shouldBeDisabled}
    >
      Reset everything
    </Button>
  )
}
