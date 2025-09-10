import { useState } from 'react';

export const useSubmitClaimFormState = () => {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [lossAmount, setLossAmount] = useState<string>('');
  const [impactedWalletAddress, setImpactedWalletAddress] =
    useState<string>('');
  const [impactedTxHash, setImpactedTxHash] = useState<string>('');
  const [reimbursementWalletAddress, setReimbursementWalletAddress] =
    useState<string>('');
  const [description, setDescription] = useState<string>('');

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    lossAmount,
    setLossAmount,
    impactedWalletAddress,
    setImpactedWalletAddress,
    impactedTxHash,
    setImpactedTxHash,
    reimbursementWalletAddress,
    setReimbursementWalletAddress,
    description,
    setDescription,
    clear: () => {
      setFirstName('');
      setLastName('');
      setEmail('');
      setLossAmount('');
      setImpactedWalletAddress('');
      setImpactedTxHash('');
      setReimbursementWalletAddress('');
      setDescription('');
    },
  };
};
