import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';
import { Attachment as ClaimAttachment } from '@metamask/claims-controller';
import { useClaims } from '../../contexts/claims/claims';
import { generateClaimSignature } from '../../store/actions';

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
  const [uploadedFiles, setUploadedFiles] = useState<ClaimAttachment[]>([]);
  const [claimSignature, setClaimSignature] = useState<string>('');

  const claimId = pathname.split('/').pop();

  useEffect(() => {
    if (isView || !chainId || !impactedWalletAddress) {
      return;
    }

    (async () => {
      const signature = await generateClaimSignature(
        chainId,
        impactedWalletAddress,
      );
      setClaimSignature(signature);
    })();
  }, [isView, chainId, impactedWalletAddress]);

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
        setUploadedFiles(claimDetails.attachments || []);
      }
    }
  }, [isView, claimId, claims]);

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
    claimSignature,
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
