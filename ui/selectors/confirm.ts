type ConfirmState = {
  confirm: {
    dummy: string;
  };
};

export const dummySelector = (state: ConfirmState) => state.confirm.dummy;
