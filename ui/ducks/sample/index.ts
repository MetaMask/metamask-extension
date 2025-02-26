import counterReducer from './counter';

export default counterReducer;
import {
  createSelector,
  createSlice,
  Dispatch,
  PayloadAction,
} from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';
import {
  MetaMaskReduxDispatch,
  CombinedBackgroundAndReduxState,
} from '../../store/store';
import { isValidHexAddress } from '@metamask/controller-utils';
import { usePetNames } from './pet-names';

const SLICE_NAME = 'petNameForm';

export type PetNameFormState = {
  currentStep: 'address' | 'name';
  ethAddress: string;
  petName: string;
  validationErrors: {
    address?: string;
    name?: string;
  };
  isSubmitting: boolean;
};

const INITIAL_STATE: PetNameFormState = {
  currentStep: 'address',
  ethAddress: '',
  petName: '',
  validationErrors: {},
  isSubmitting: false,
};

const petNameFormSlice = createSlice({
  name: SLICE_NAME,
  initialState: INITIAL_STATE,
  reducers: {
    setAddress: (state, action: PayloadAction<string>) => {
      state.ethAddress = action.payload;
      state.validationErrors = {};
    },
    setPetName: (state, action: PayloadAction<string>) => {
      state.petName = action.payload;
      state.validationErrors = {};
    },
    setStep: (state, action: PayloadAction<'address' | 'name'>) => {
      state.currentStep = action.payload;
    },
    setValidationError: (
      state,
      action: PayloadAction<{ field: 'address' | 'name'; error: string }>,
    ) => {
      state.validationErrors[action.payload.field] = action.payload.error;
    },
    setIsSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    reset: () => INITIAL_STATE,
  },
});

export const {
  setAddress,
  setPetName,
  setStep,
  setValidationError,
  setIsSubmitting,
  reset,
} = petNameFormSlice.actions;

// --- Thunks ---

export const validateAndProceedToName = (address: string) => {
  return (dispatch: Dispatch) => {
    if (!address) {
      dispatch(
        setValidationError({ field: 'address', error: 'Address is required' }),
      );
      return false;
    }
    if (!isValidHexAddress(address)) {
      dispatch(
        setValidationError({
          field: 'address',
          error: 'Please enter a valid Ethereum address',
        }),
      );
      return false;
    }
    dispatch(setAddress(address));
    dispatch(setStep('name'));
    return true;
  };
};

export const validateAndSubmitPetName = (
  name: string,
  petNamesAPI: ReturnType<typeof usePetNames>,
) => {
  return async (
    dispatch: Dispatch,
    getState: () => CombinedBackgroundAndReduxState,
  ) => {
    if (!name.trim()) {
      dispatch(
        setValidationError({ field: 'name', error: 'Name is required' }),
      );
      return false;
    }
    if (name.length > 32) {
      dispatch(
        setValidationError({
          field: 'name',
          error: 'Name must be 32 characters or less',
        }),
      );
      return false;
    }

    const state = getState();
    const address = selectEthAddress(state as unknown as HasPetNameFormSlice);

    dispatch(setPetName(name));
    dispatch(setIsSubmitting(true));

    try {
      await petNamesAPI.assignPetName(address, name);
      dispatch(reset());
      return true;
    } catch (error) {
      dispatch(
        setValidationError({
          field: 'name',
          error:
            error instanceof Error ? error.message : 'Failed to save pet name',
        }),
      );
      dispatch(setIsSubmitting(false));
      return false;
    }
  };
};

// --- Selectors ---

type HasPetNameFormSlice = {
  [SLICE_NAME]: PetNameFormState;
};

const selectPetNameFormState = (state: HasPetNameFormSlice) =>
  state[SLICE_NAME];

export const selectCurrentStep = createSelector(
  selectPetNameFormState,
  (state) => state.currentStep,
);

export const selectEthAddress = createSelector(
  selectPetNameFormState,
  (state) => state.ethAddress,
);

export const selectPetName = createSelector(
  selectPetNameFormState,
  (state) => state.petName,
);

export const selectValidationErrors = createSelector(
  selectPetNameFormState,
  (state) => state.validationErrors,
);

export const selectIsSubmitting = createSelector(
  selectPetNameFormState,
  (state) => state.isSubmitting,
);

// --- Hook ---

export function usePetNameForm() {
  const currentStep = useSelector(selectCurrentStep);
  const ethAddress = useSelector(selectEthAddress);
  const petName = useSelector(selectPetName);
  const validationErrors = useSelector(selectValidationErrors);
  const isSubmitting = useSelector(selectIsSubmitting);
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  return {
    currentStep,
    ethAddress,
    petName,
    validationErrors,
    isSubmitting,
    setAddress: (address: string) => dispatch(setAddress(address)),
    setPetName: (name: string) => dispatch(setPetName(name)),
    setStep: (step: 'address' | 'name') => dispatch(setStep(step)),
    validateAndProceedToName: (address: string) =>
      dispatch(validateAndProceedToName(address)),
    validateAndSubmitPetName: (name: string) =>
      dispatch(validateAndSubmitPetName(name, usePetNames())),
    reset: () => dispatch(reset()),
  };
}

export default petNameFormSlice.reducer;
