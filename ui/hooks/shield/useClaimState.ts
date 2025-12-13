import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Attachment as ClaimAttachment } from '@metamask/claims-controller';
import { useClaims } from '../../contexts/claims/claims';
import { generateClaimSignature } from '../../store/actions';
import { useClaimDraft } from './useClaimDraft';

export type ClaimStateMode = 'new' | 'view' | 'edit-draft';

export const useClaimState = (mode: ClaimStateMode = 'new') => {
  const { pathname } = useLocation();
  const { claims } = useClaims();
  const { getDraft } = useClaimDraft();
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
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();

  const isView = mode === 'view';
  const isEditDraft = mode === 'edit-draft';
  const claimOrDraftId = pathname.split('/').pop();

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

  // Load claim data for view mode
  useEffect(() => {
    if (isView && claimOrDraftId) {
      const claimDetails = claims.find((claim) => claim.id === claimOrDraftId);
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
  }, [isView, claimOrDraftId, claims]);

  // Load draft data for edit-draft mode
  useEffect(() => {
    if (isEditDraft && claimOrDraftId) {
      const draftDetails = getDraft(claimOrDraftId);
      if (draftDetails) {
        setCurrentDraftId(draftDetails.id);
        setEmail(draftDetails.email);
        setChainId(draftDetails.chainId);
        setImpactedWalletAddress(draftDetails.impactedWalletAddress);
        setImpactedTransactionHash(draftDetails.impactedTransactionHash);
        setReimbursementWalletAddress(draftDetails.reimbursementWalletAddress);
        setCaseDescription(draftDetails.caseDescription);
      }
    }
  }, [isEditDraft, claimOrDraftId, getDraft]);

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
    currentDraftId,
    clear: () => {
      setChainId('');
      setEmail('');
      setImpactedWalletAddress('');
      setImpactedTransactionHash('');
      setReimbursementWalletAddress('');
      setCaseDescription('');
      setFiles(undefined);
      setCurrentDraftId(undefined);
    },
  };
};
