import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAsyncResult } from '../useAsync';
import {
  ShieldClaim,
  ShieldClaimAttachment,
} from '../../pages/settings/transaction-shield-tab/types';
import { getShieldClaimDetails } from '../../store/actions';

export const useClaimState = (isClaimViewPage: boolean = false) => {
  const { pathname } = useLocation();
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

  const claimDetailsResult = useAsyncResult<ShieldClaim | null>(async () => {
    if (isClaimViewPage && claimId) {
      try {
        const claim = await getShieldClaimDetails(claimId as string);
        return claim;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return null;
  }, [isClaimViewPage, claimId]);

  useEffect(() => {
    if (claimDetailsResult.value) {
      setEmail(claimDetailsResult.value.email);
      setImpactedWalletAddress(claimDetailsResult.value.impactedWalletAddress);
      setImpactedTransactionHash(claimDetailsResult.value.impactedTxHash);
      setReimbursementWalletAddress(
        claimDetailsResult.value.reimbursementWalletAddress,
      );
      setCaseDescription(claimDetailsResult.value.description);
      setUploadedFiles(claimDetailsResult.value.attachments);
    }
  }, [claimDetailsResult.value]);

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
    loadingClaimDetails: claimDetailsResult.status === 'pending',
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
