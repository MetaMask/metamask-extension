type ConfirmState = {
  confirm: {
    currentConfirmation: Record<string, unknown>;
  };
};

export const currentConfirmationSelector = (state: ConfirmState) =>
  state.confirm.currentConfirmation;
