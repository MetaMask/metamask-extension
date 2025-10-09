import { useState } from 'react';

export const useClaimState = () => {
  const [email, setEmail] = useState<string>('');
  const [impactedWalletAddress, setImpactedWalletAddress] =
    useState<string>('');
  const [impactedTxHash, setImpactedTxHash] = useState<string>('');
  const [reimbursementWalletAddress, setReimbursementWalletAddress] =
    useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [files, setFiles] = useState<FileList>();

  return {
    email,
    setEmail,
    impactedWalletAddress,
    setImpactedWalletAddress,
    impactedTxHash,
    setImpactedTxHash,
    reimbursementWalletAddress,
    setReimbursementWalletAddress,
    description,
    setDescription,
    files,
    setFiles,
    clear: () => {
      setEmail('');
      setImpactedWalletAddress('');
      setImpactedTxHash('');
      setReimbursementWalletAddress('');
      setDescription('');
      setFiles(undefined);
    },
  };
};
