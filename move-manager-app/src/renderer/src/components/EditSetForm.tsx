import React, { useState, useMemo, useEffect } from 'react';
import {
  Flex,
  Select,
  Separator,
  Box,
} from '@radix-ui/themes';
import { Pencil1Icon } from '@radix-ui/react-icons'; // Keep for Color Select for now, or remove if not needed
import { SetData } from './MoveGridSet';
import {
  LabeledSection,
  EditableTextField,
  VersionsSection,
  VersionInfo,
} from './SidebarComponents';

// Mock colors - copied from Sidebar, might need to be passed as prop later
const mockColors = [
  { name: 'Cyan', value: 'var(--cyan-9)' },
  { name: 'Blue', value: 'var(--blue-9)' },
  { name: 'Green', value: 'var(--green-9)' },
  { name: 'Orange', value: 'var(--orange-9)' },
  { name: 'Red', value: 'var(--red-9)' },
  { name: 'Purple', value: 'var(--purple-9)' },
];

interface EditSetFormProps {
  set: SetData;
  otherVersions: VersionInfo[];
  onUpdateSet: (updatedSet: Partial<SetData>) => void;
}

export const EditSetForm: React.FC<EditSetFormProps> = ({
  set,
  otherVersions,
  onUpdateSet,
}) => {
  // Internal state for version selection and locking
  const [selectedVersionId, setSelectedVersionId] = useState('current');
  const [lockedVersionId, setLockedVersionId] = useState<string | null>(null);

  // Reset internal state when the set prop changes
  useEffect(() => {
    setSelectedVersionId('current');
    setLockedVersionId(null);
    // Note: If text fields were controlled, reset their state here too.
    // Since we are using the `key` prop on EditSetForm now, their
    // internal state is reset by React remounting them.
  }, [set.id]); // Dependency array ensures this runs when the set ID changes

  // --- Mock Handlers (pointing to console logs for now) ---
  // These could eventually call onUpdateSet
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Form: Name changed:', e.target.value);
    // onUpdateSet({ name: e.target.value });
  };
  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Form: Alias changed:', e.target.value);
    // onUpdateSet({ alias: e.target.value });
  };
  const handleColorChange = (colorValue: string) => {
    console.log('Form: Color changed:', colorValue);
    // onUpdateSet({ color: colorValue });
  };
  // ------------------------------------------------------ //

  // --- Internal Handlers --- //
  const handleVersionChange = (versionId: string) => {
    console.log('Form: Version changed:', versionId);
    setSelectedVersionId(versionId);
  };

  const handleLockVersionToggle = (versionId: string) => {
    const newLockedId = lockedVersionId === versionId ? null : versionId;
    setLockedVersionId(newLockedId);
    console.log(`Form: Toggled lock for version: ${versionId}. New Locked ID: ${newLockedId}`);
  };
  // ------------------------------------------------------ //

  return (
    <Flex direction="column" gap="4">
      {/* Set Name - Using EditableTextField */}
      <EditableTextField
        label="Set name"
        value={set.name}
        placeholder="Enter set name"
        onChange={handleNameChange}
      />

      {/* Alias - Using EditableTextField */}
      <EditableTextField
        label="Alias on this page"
        value={set.alias}
        placeholder="Enter alias (optional)"
        onChange={handleAliasChange}
      />

      {/* Color - Using LabeledSection */}
      <LabeledSection label="Color">
        <Flex align="center" gap="2">
          <Select.Root value={set.color} onValueChange={handleColorChange}>
            <Select.Trigger placeholder="Select color…" style={{ flexGrow: 1 }} />
            <Select.Content position="popper">
              {mockColors.map((color) => (
                <Select.Item key={color.value} value={color.value}>
                  <Flex align="center" gap="2">
                    <Box width="12px" height="12px" style={{ backgroundColor: color.value, borderRadius: '50%' }} />
                    {color.name}
                  </Flex>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          {/* Removed edit button previously */}
        </Flex>
      </LabeledSection>

      <Separator size="4" />

      {/* Versions Section */}
      <VersionsSection
        currentRevision={set.revision}
        otherVersions={otherVersions}
        selectedVersionId={selectedVersionId}
        lockedVersionId={lockedVersionId}
        onVersionChange={handleVersionChange}
        onLockVersionToggle={handleLockVersionToggle}
      />
    </Flex>
  );
}; 