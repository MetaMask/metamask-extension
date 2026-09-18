import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Attachment as ClaimAttachment } from '@metamask/claims-controller';
import { useClaims } from '../../contexts/claims/claims';
import { generateClaimSignature } from '../../store/actions';
import {
  CLAIMS_FORM_MODES,
  ClaimsFormMode,
} from '../../pages/shield/transaction-shield/types';
import { useClaimDraft } from './useClaimDraft';

type ClaimFormFields = {
  chainId: string;
  email: string;
  impactedWalletAddress: string;
  impactedTransactionHash: string;
  reimbursementWalletAddress: string;
  caseDescription: string;
  uploadedFiles: ClaimAttachment[];
  currentDraftId: string | undefined;
};

const EMPTY_FORM: ClaimFormFields = {
  chainId: '',
  email: '',
  impactedWalletAddress: '',
  impactedTransactionHash: '',
  reimbursementWalletAddress: '',
  caseDescription: '',
  uploadedFiles: [],
  currentDraftId: undefined,
};

export const useClaimState = (mode: ClaimsFormMode = CLAIMS_FORM_MODES.NEW) => {
  const { pathname } = useLocation();
  const { claims } = useClaims();
  const { getDraft } = useClaimDraft();
  const [files, setFiles] = useState<FileList>();
  const [claimSignature, setClaimSignature] = useState<string>('');

  const isView = mode === CLAIMS_FORM_MODES.VIEW;
  const isEditDraft = mode === CLAIMS_FORM_MODES.EDIT_DRAFT;
  const claimOrDraftId = pathname.split('/').pop();

  let sourceKey = 'new';
  if (isView) {
    sourceKey = `view:${claimOrDraftId ?? ''}`;
  } else if (isEditDraft) {
    sourceKey = `draft:${claimOrDraftId ?? ''}`;
  }

  const derivedForm = useMemo((): ClaimFormFields => {
    if (isView && claimOrDraftId) {
      const claimDetails = claims.find((claim) => claim.id === claimOrDraftId);
      if (claimDetails) {
        return {
          chainId: claimDetails.chainId,
          email: claimDetails.email,
          impactedWalletAddress: claimDetails.impactedWalletAddress,
          impactedTransactionHash: claimDetails.impactedTxHash,
          reimbursementWalletAddress: claimDetails.reimbursementWalletAddress,
          caseDescription: claimDetails.description,
          uploadedFiles: claimDetails.attachments || [],
          currentDraftId: undefined,
        };
      }
    }
    if (isEditDraft && claimOrDraftId) {
      const draftDetails = getDraft(claimOrDraftId);
      if (draftDetails) {
        return {
          chainId: draftDetails.chainId || '',
          email: draftDetails.email || '',
          impactedWalletAddress: draftDetails.impactedWalletAddress || '',
          impactedTransactionHash: draftDetails.impactedTxHash || '',
          reimbursementWalletAddress:
            draftDetails.reimbursementWalletAddress || '',
          caseDescription: draftDetails.description || '',
          uploadedFiles: [],
          currentDraftId: draftDetails.draftId,
        };
      }
    }
    return EMPTY_FORM;
  }, [claimOrDraftId, claims, getDraft, isEditDraft, isView]);

  // Local edits are keyed by sourceKey so switching claim/draft drops them
  // without render-phase setState.
  const [formState, setFormState] = useState<{
    key: string;
    fields: ClaimFormFields;
    dirty: boolean;
  }>({ key: sourceKey, fields: derivedForm, dirty: false });

  const fields =
    formState.key === sourceKey && formState.dirty
      ? formState.fields
      : derivedForm;

  const updateField = useCallback(
    <FieldKey extends keyof ClaimFormFields>(
      fieldKey: FieldKey,
      value: ClaimFormFields[FieldKey],
    ) => {
      setFormState((prev) => {
        const base =
          prev.key === sourceKey && prev.dirty ? prev.fields : derivedForm;
        return {
          key: sourceKey,
          dirty: true,
          fields: { ...base, [fieldKey]: value },
        };
      });
    },
    [derivedForm, sourceKey],
  );

  useEffect(() => {
    if (isView || !fields.chainId || !fields.impactedWalletAddress) {
      return;
    }

    (async () => {
      const signature = await generateClaimSignature(
        fields.chainId,
        fields.impactedWalletAddress,
      );
      setClaimSignature(signature);
    })();
  }, [isView, fields.chainId, fields.impactedWalletAddress]);

  return {
    chainId: fields.chainId,
    setChainId: (value: string) => updateField('chainId', value),
    email: fields.email,
    setEmail: (value: string) => updateField('email', value),
    impactedWalletAddress: fields.impactedWalletAddress,
    setImpactedWalletAddress: (value: string) =>
      updateField('impactedWalletAddress', value),
    impactedTransactionHash: fields.impactedTransactionHash,
    setImpactedTransactionHash: (value: string) =>
      updateField('impactedTransactionHash', value),
    reimbursementWalletAddress: fields.reimbursementWalletAddress,
    setReimbursementWalletAddress: (value: string) =>
      updateField('reimbursementWalletAddress', value),
    caseDescription: fields.caseDescription,
    setCaseDescription: (value: string) =>
      updateField('caseDescription', value),
    files,
    setFiles,
    uploadedFiles: fields.uploadedFiles,
    claimSignature,
    currentDraftId: fields.currentDraftId,
    clear: () => {
      setFormState({ key: sourceKey, fields: EMPTY_FORM, dirty: true });
      setFiles(undefined);
    },
  };
};
