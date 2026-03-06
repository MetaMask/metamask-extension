export type EditContactFormProps = {
  address: string;
  initialName: string;
  contactChainId: string;
  onCancel: () => void;
  onSuccess: () => void;
};

export type AddContactFormProps = {
  onCancel: () => void;
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
};
