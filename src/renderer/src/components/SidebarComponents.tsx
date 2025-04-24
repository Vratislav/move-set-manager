import React from 'react';
import { Flex, Text, TextField, IconButton, RadioCards, Box } from '@radix-ui/themes';
import { Pencil1Icon, LockClosedIcon, LockOpen1Icon } from '@radix-ui/react-icons';

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
      </Flex>
    </LabeledSection>
  );
};

// --- VersionRadioCard --- //
interface VersionRadioCardProps {
  value: string;
  displayName: string;
  revision: string;
  isLocked: boolean;
  isCurrentlySelected: boolean;
  isLockable: boolean;
  onLockToggle: () => void;
}

export const VersionRadioCard: React.FC<VersionRadioCardProps> = ({
  value,
  displayName,
  revision,
  isLocked,
  isCurrentlySelected,
  isLockable,
  onLockToggle,
}) => {
  const showLockIcon = isCurrentlySelected && isLockable;
  const LockIcon = isLocked ? LockClosedIcon : LockOpen1Icon;

  // Apply subtle styling to the wrapper when locked
  const lockedStyle = isLocked ? {
    // We'll apply border to the item itself now
  } : {};

  return (
    // Wrap Item and Button in a Flex container to avoid nesting buttons
    <Flex align="center" gap="2" style={lockedStyle}>
      <RadioCards.Item
        value={value}
        style={{
          flexGrow: 1,
          // Apply border directly to the item if locked
          border: isLocked ? '1px solid var(--blue-a7)' : undefined,
          // Adjust padding if needed to align with button
          paddingRight: showLockIcon ? 'var(--space-1)' : undefined,
        }}
      >
        {/* Content of the radio item */}
        <Text>{displayName} {revision}</Text>
      </RadioCards.Item>

      {/* Lock button rendered as a sibling, not a child */}
      {showLockIcon && (
        <IconButton
          variant="ghost"
          size="1"
          aria-label={isLocked ? `Unlock version ${displayName}` : `Lock version ${displayName}`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent card selection change
            onLockToggle();
          }}
          color={isLocked ? 'blue' : 'gray'} // Use a specific theme color
          // Remove negative margin/padding styles if they were added
          style={{ flexShrink: 0 }} // Prevent button from shrinking
        >
          <LockIcon />
        </IconButton>
      )}
    </Flex>
  );
};

// --- VersionsSection --- //
export interface VersionInfo {
  id: string;
  name: string;
  revision: string;
  isLockable?: boolean;
}

interface VersionsSectionProps {
  currentRevision: string;
  otherVersions: VersionInfo[];
  selectedVersionId: string;
  lockedVersionId: string | null;
  onVersionChange: (versionId: string) => void;
  onLockVersionToggle: (versionId: string) => void;
}

export const VersionsSection: React.FC<VersionsSectionProps> = ({
  currentRevision,
  otherVersions,
  selectedVersionId,
  lockedVersionId,
  onVersionChange,
  onLockVersionToggle,
}) => {
  const allVersions: VersionInfo[] = [
    { id: 'current', name: 'Current', revision: `(${currentRevision})`, isLockable: false },
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
            isLocked={version.id === lockedVersionId}
            isCurrentlySelected={version.id === selectedVersionId}
            isLockable={!!version.isLockable}
            onLockToggle={() => onLockVersionToggle(version.id)}
          />
        ))}
      </RadioCards.Root>
    </LabeledSection>
  );
}; 