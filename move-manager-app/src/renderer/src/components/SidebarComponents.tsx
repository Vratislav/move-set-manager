import React from 'react';
import { Flex, Text, TextField, IconButton, RadioCards, Box } from '@radix-ui/themes';
import { Pencil1Icon } from '@radix-ui/react-icons';

// --- LabeledSection --- //
interface LabeledSectionProps {
  label: string;
  children: React.ReactNode;
}

export const LabeledSection: React.FC<LabeledSectionProps> = ({ label, children }) => {
  return (
    <Flex direction="column" gap="1">
      <Text size="2" weight="bold">{label}:</Text>
      {children}
    </Flex>
  );
};

// --- EditableTextField --- //
interface EditableTextFieldProps {
  label: string;
  value: string | undefined;
  placeholder: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // onEditClick?: () => void; // Optional: Add if edit button needs specific logic
}

export const EditableTextField: React.FC<EditableTextFieldProps> = ({
  label,
  value,
  placeholder,
  onChange,
  // onEditClick,
}) => {
  return (
    <LabeledSection label={label}>
      <Flex align="center" gap="2">
        <TextField.Root
          defaultValue={value ?? ''}
          placeholder={placeholder}
          onChange={onChange}
          style={{ flexGrow: 1 }}
        />
        <IconButton
          variant="ghost"
          size="1"
          aria-label={`Edit ${label.toLowerCase()}`}
          // onClick={onEditClick} // Add if needed
        >
          <Pencil1Icon />
        </IconButton>
      </Flex>
    </LabeledSection>
  );
};

// --- VersionRadioCard --- //
interface VersionRadioCardProps {
  value: string; // e.g., "current" or version id
  displayName: string; // e.g., "Current" or "Make it more punchy"
  revision: string; // e.g., "(revabc)" or "(d324c)"
  showEditButton?: boolean;
  onEditClick?: () => void;
}

export const VersionRadioCard: React.FC<VersionRadioCardProps> = ({
  value,
  displayName,
  revision,
  showEditButton = false,
  onEditClick,
}) => {
  return (
    <RadioCards.Item value={value}>
      <Flex justify="between" align="center" width="100%">
        <Text>{displayName} {revision}</Text>
        {showEditButton && (
          <IconButton
            variant="ghost"
            size="1"
            aria-label={`Edit version ${displayName}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent card selection change if clicking button
              onEditClick?.();
            }}
          >
            <Pencil1Icon />
          </IconButton>
        )}
      </Flex>
    </RadioCards.Item>
  );
};

// --- VersionsSection --- //
export interface VersionInfo {
  id: string; // Used as value for RadioCard.Item
  name: string;
  revision: string;
  isEditable?: boolean;
}

interface VersionsSectionProps {
  currentRevision: string; // The revision ID of the set itself
  otherVersions: VersionInfo[]; // List of other available versions
  selectedVersionId: string; // The ID of the currently selected radio button
  onVersionChange: (versionId: string) => void;
  onEditVersionClick: (versionId: string) => void;
}

export const VersionsSection: React.FC<VersionsSectionProps> = ({
  currentRevision,
  otherVersions,
  selectedVersionId,
  onVersionChange,
  onEditVersionClick,
}) => {
  // Combine current revision with others for the list
  const allVersions: VersionInfo[] = [
    { id: 'current', name: 'Current', revision: `(${currentRevision})`, isEditable: false },
    ...otherVersions,
  ];

  return (
    <LabeledSection label="Versions">
      <RadioCards.Root
        value={selectedVersionId}
        onValueChange={onVersionChange}
        columns="1"
      >
        {allVersions.map((version) => (
          <VersionRadioCard
            key={version.id}
            value={version.id}
            displayName={version.name}
            revision={version.revision}
            showEditButton={version.isEditable}
            onEditClick={() => onEditVersionClick(version.id)}
          />
        ))}
      </RadioCards.Root>
    </LabeledSection>
  );
}; 