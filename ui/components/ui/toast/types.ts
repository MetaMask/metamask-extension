export type Handlers<TTxn> = {
  onPending?: (transaction: TTxn) => void;
  onSuccess?: (transaction: TTxn) => void;
  onFailure?: (transaction: TTxn) => void;
};
