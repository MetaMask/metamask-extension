import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  ButtonLinkSize,
  IconName,
} from '../../../../components/component-library';
import { IconColor } from '../../../../helpers/constants/design-system';

export type CapabilityApprovalProps = {
  capabilityName: string;
  description: string;
  methodNames: string[];
  sourceCode: string;
  onApprove: (edited: {
    capabilityName: string;
    description: string;
    methodNames: string[];
    sourceCode: string;
  }) => void;
  onReject: () => void;
};

export const CapabilityApproval: React.FC<CapabilityApprovalProps> = ({
  capabilityName: initialName,
  description: initialDescription,
  methodNames: initialMethodNames,
  sourceCode: initialSourceCode,
  onApprove,
  onReject,
}) => {
  const [capabilityName, setCapabilityName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [methodNames, setMethodNames] = useState<string[]>(initialMethodNames);
  const [sourceCode, setSourceCode] = useState(initialSourceCode);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const resizeDescription = useCallback(() => {
    const el = descriptionRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeDescription();
    window.addEventListener('resize', resizeDescription);
    return () => window.removeEventListener('resize', resizeDescription);
  }, [resizeDescription]);

  const handleAddMethod = useCallback(() => {
    setMethodNames((prev) => [...prev, '']);
  }, []);

  const handleRemoveMethod = useCallback((index: number) => {
    setMethodNames((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleMethodChange = useCallback((index: number, value: string) => {
    setMethodNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleApprove = useCallback(() => {
    onApprove({ capabilityName, description, methodNames, sourceCode });
  }, [onApprove, capabilityName, description, methodNames, sourceCode]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full justify-between"
    >
      {/* Header */}
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="mb-4"
      >
        <Text
          variant={TextVariant.HeadingMd}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
        >
          Capability Approval
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
        >
          Review and optionally edit the capability before approving.
        </Text>
      </Box>

      {/* Scrollable content area */}
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={3}
        className="flex-1 overflow-y-auto px-4"
      >
        {/* Name field */}
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          padding={3}
          className="rounded-lg"
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            Name
          </Text>
          <input
            type="text"
            value={capabilityName}
            onChange={(e) => setCapabilityName(e.target.value)}
            className="rounded-md"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border-muted)',
              background: 'var(--color-background-default)',
              color: 'var(--color-text-default)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </Box>

        {/* Description field */}
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          padding={3}
          className="rounded-lg"
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            Description
          </Text>
          <textarea
            ref={descriptionRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              resizeDescription();
            }}
            rows={1}
            className="rounded-md"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border-muted)',
              background: 'var(--color-background-default)',
              color: 'var(--color-text-default)',
              fontSize: '14px',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              lineHeight: '1.4',
            }}
          />
        </Box>

        {/* Method names */}
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          padding={3}
          className="rounded-lg"
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            Method Names
          </Text>
          {methodNames.map((method, index) => (
            <Box
              key={`method-${index}`}
              flexDirection={BoxFlexDirection.Row}
              gap={2}
              alignItems={BoxAlignItems.Center}
            >
              <input
                type="text"
                value={method}
                onChange={(e) => handleMethodChange(index, e.target.value)}
                className="rounded-md"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--color-border-muted)',
                  background: 'var(--color-background-default)',
                  color: 'var(--color-text-default)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <ButtonIcon
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                color={IconColor.errorDefault}
                ariaLabel={`Remove method ${method || index}`}
                onClick={() => handleRemoveMethod(index)}
              />
            </Box>
          ))}
          <span style={{ fontSize: '14px', alignSelf: 'center' }}>
            <ButtonLink
              size={ButtonLinkSize.Inherit}
              startIconName={IconName.Add}
              onClick={handleAddMethod}
            >
              Add method
            </ButtonLink>
          </span>
        </Box>

        {/* Source code */}
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          padding={3}
          className="rounded-lg"
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            Source Code
          </Text>
          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            rows={16}
            wrap="off"
            className="rounded-md"
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              padding: '12px',
              border: '1px solid var(--color-border-muted)',
              background: 'var(--color-background-default)',
              color: 'var(--color-text-default)',
              width: '100%',
              resize: 'vertical',
              overflowX: 'auto',
              whiteSpace: 'pre',
              outline: 'none',
            }}
          />
        </Box>
      </Box>

      {/* Footer buttons */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={4}
        padding={4}
        borderColor={BoxBorderColor.BorderMuted}
        className="border-t"
      >
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onReject}
          className="flex-1"
        >
          Reject
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          onClick={handleApprove}
          className="flex-1"
        >
          Approve
        </Button>
      </Box>
    </Box>
  );
};
