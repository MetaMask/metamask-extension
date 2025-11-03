import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldClaimAttachment } from '../../pages/settings/transaction-shield-tab/types';
import { useClaims } from '../../contexts/claims/claims';

export const useClaimState = (isView: boolean = false) => {
  const { pathname } = useLocation();
  const { claims } = useClaims();
  const [chainId, setChainId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [impactedWalletAddress, setImpactedWalletAddress] =
    useState<string>('');
  const [impactedTransactionHash, setImpactedTransactionHash] =
    useState<string>('');
  const [reimbursementWalletAddress, setReimbursementWalletAddress] =
    useState<string>('');
  const [caseDescription, setCaseDescription] = useState<string>('');
  const [files, setFiles] = useState<FileList>();
  const [uploadedFiles, setUploadedFiles] = useState<ShieldClaimAttachment[]>(
    [],
  );

  const claimId = pathname.split('/').pop();

  useEffect(() => {
    if (isView && claimId) {
      const claimDetails = claims.find((claim) => claim.id === claimId);
      if (claimDetails) {
        setEmail(claimDetails.email);
        setChainId(claimDetails.chainId);
        setImpactedWalletAddress(claimDetails.impactedWalletAddress);
        setImpactedTransactionHash(claimDetails.impactedTxHash);
        setReimbursementWalletAddress(claimDetails.reimbursementWalletAddress);
        setCaseDescription(claimDetails.description);
        setUploadedFiles(claimDetails.attachments);
      }
    }
  }, [
    isView,
    claimId,
    claims,
    setChainId,
    setEmail,
    setImpactedWalletAddress,
    setImpactedTransactionHash,
    setReimbursementWalletAddress,
    setCaseDescription,
    setUploadedFiles,
  ]);

  return {
    chainId,
    setChainId,
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
    uploadedFiles,
    clear: () => {
      setChainId('');
      setEmail('');
      setImpactedWalletAddress('');
      setImpactedTransactionHash('');
      setReimbursementWalletAddress('');
      setCaseDescription('');
      setFiles(undefined);
    },
  };
};
