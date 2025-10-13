import { useState } from 'react';

export const useClaimState = () => {
  const [email, setEmail] = useState<string>('');
  const [impactedWalletAddress, setImpactedWalletAddress] =
    useState<string>('');
  const [impactedTransactionHash, setImpactedTransactionHash] =
    useState<string>('');
  const [reimbursementWalletAddress, setReimbursementWalletAddress] =
    useState<string>('');
  const [caseDescription, setCaseDescription] = useState<string>('');
  const [files, setFiles] = useState<FileList>();

  return {
    email,
    setEmail,
    impactedWalletAddress,
    setImpactedWalletAddress,
    impactedTransactionHash,
    setImpactedTransactionHash,
    reimbursementWalletAddress,
    setReimbursementWalletAddress,
    caseDescription,
    setCaseDescription,
    files,
    setFiles,
    clear: () => {
      setEmail('');
      setImpactedWalletAddress('');
      setImpactedTransactionHash('');
      setReimbursementWalletAddress('');
      setCaseDescription('');
      setFiles(undefined);
    },
  };
};
