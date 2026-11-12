export type EditContactFormProps = {
  address: string;
  initialName: string;
  initialMemo: string;
  contactChainId: string;
  onSuccess: () => void;
};

export type AddContactFormProps = {
  onSuccess: () => void;
};

export type ViewContactContentProps = {
  name: string;
  address: string;
  checkSummedAddress: string;
  memo: string;
  chainId: string;
  onEdit: () => void;
  onDelete: () => void;
};

export type ContactListItemProps = {
  address: string;
  name: string;
  chainId: string;
  onSelect: () => void;
  isDuplicate?: boolean;
};
