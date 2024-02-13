import { FormState, InterfaceState } from '@metamask/snaps-sdk';

export const mergeValue = (
  state: InterfaceState,
  name: string,
  value: string | null,
  form?: string,
): InterfaceState => {
  if (form) {
    return {
      ...state,
      [form]: {
        ...(state[form] as FormState),
        [name]: value,
      },
    };
  }
  return { ...state, [name]: value };
};
