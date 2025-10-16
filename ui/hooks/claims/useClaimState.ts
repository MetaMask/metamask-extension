import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldClaimAttachment } from '../../pages/settings/transaction-shield-tab/types';
import { useClaims } from '../../contexts/claims/claims';

export const useClaimState = (isView: boolean = false) => {
  const { pathname } = useLocation();
  const { claims } = useClaims();
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
        setImpactedWalletAddress(claimDetails.impactedWalletAddress);
        setImpactedTransactionHash(claimDetails.impactedTxHash);
        setReimbursementWalletAddress(claimDetails.reimbursementWalletAddress);
        setCaseDescription(claimDetails.description);
        setUploadedFiles(claimDetails.attachments);
      }
    }
  }, [isView, claimId, claims]);

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
    uploadedFiles,
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
