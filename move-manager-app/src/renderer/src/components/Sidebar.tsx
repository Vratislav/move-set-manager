import React, { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  IconButton,
  Select,
  RadioCards,
  Separator,
} from '@radix-ui/themes';
import { Pencil1Icon, Cross1Icon } from '@radix-ui/react-icons';
import { SetData } from './MoveGridSet';
import { LabeledSection, EditableTextField, VersionsSection, VersionInfo } from './SidebarComponents'; // Import reusable components
import './Sidebar.css';

interface SidebarProps {
  selectedSet: SetData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSet: (updatedSet: Partial<SetData>) => void;
}

// Mock colors - replace with actual color data later
const mockColors = [
  { name: 'Cyan', value: 'var(--cyan-9)' },
  { name: 'Blue', value: 'var(--blue-9)' },
  { name: 'Green', value: 'var(--green-9)' },
  { name: 'Orange', value: 'var(--orange-9)' },
  { name: 'Red', value: 'var(--red-9)' },
  { name: 'Purple', value: 'var(--purple-9)' },
];

// Mock data for other versions
const mockOtherVersions: VersionInfo[] = [
  { id: 'punchy-d324c', name: 'Make it more punchy', revision: '(d324c)', isLockable: true },
  // Add more mock versions here if needed
];

export const Sidebar: React.FC<SidebarProps> = ({ selectedSet, isOpen, onClose, onUpdateSet }) => {
  if (!selectedSet) return null;

  // State for the selected version in the radio group
  const [selectedVersionId, setSelectedVersionId] = useState<string>('current');
  // State for the locked version ID
  const [lockedVersionId, setLockedVersionId] = useState<string | null>(null);

  // --- Mock Handlers (keep using console.log for now) --- //
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Name changed:', e.target.value);
    // onUpdateSet({ name: e.target.value });
  };
  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Alias changed:', e.target.value);
    // onUpdateSet({ alias: e.target.value });
  };
  const handleColorChange = (colorValue: string) => {
    console.log('Color changed:', colorValue);
    // onUpdateSet({ color: colorValue });
  };
  const handleVersionChange = (versionId: string) => {
    console.log('Version changed:', versionId);
    setSelectedVersionId(versionId); // Update state
  };
  const handleLockVersionToggle = (versionId: string) => {
    const newLockedId = lockedVersionId === versionId ? null : versionId;
    setLockedVersionId(newLockedId);
    console.log(`Toggled lock for version: ${versionId}. New Locked ID: ${newLockedId}`);
    // Note: In a real app, you might want to prevent changing selectedVersionId
    // if a version is locked, or handle that interaction differently.
  };
  // ------------------------------------------------------ //

  return (
    <Box className={`sidebar ${isOpen ? 'open' : ''}`}>
      <Flex direction="column" gap="4" p="4" height="100%">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="5">Set Details</Heading>
          <Flex align="center" gap="3">
            <Text size="1" color="gray">id: {selectedSet.id}</Text>
            <IconButton variant="ghost" color="gray" onClick={onClose} aria-label="Close sidebar">
              <Cross1Icon />
            </IconButton>
          </Flex>
        </Flex>

        <Separator size="4" />

        {/* Set Name - Using EditableTextField */}
        <EditableTextField
          label="Set name"
          value={selectedSet.name}
          placeholder="Enter set name"
          onChange={handleNameChange}
        />

        {/* Alias - Using EditableTextField */}
        <EditableTextField
          label="Alias on this page"
          value={selectedSet.alias}
          placeholder="Enter alias (optional)"
          onChange={handleAliasChange}
        />

        {/* Color - Using LabeledSection */}
        <LabeledSection label="Color">
          <Flex align="center" gap="2">
            <Select.Root value={selectedSet.color} onValueChange={handleColorChange}>
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
          </Flex>
        </LabeledSection>

        <Separator size="4" />

        {/* Versions Section */}
        <VersionsSection
          currentRevision={selectedSet.revision}
          otherVersions={mockOtherVersions} // Pass mock other versions
          selectedVersionId={selectedVersionId} // Pass state
          lockedVersionId={lockedVersionId} // Pass locked state
          onVersionChange={handleVersionChange} // Pass handler
          onLockVersionToggle={handleLockVersionToggle} // Pass lock toggle handler
        />

      </Flex>
    </Box>
  );
}; 