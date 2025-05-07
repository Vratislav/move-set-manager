import React, { useState, useEffect } from 'react';
import {
  Flex,
  Select,
  Separator,
  Box,
} from '@radix-ui/themes';
import { ReactSetData } from './MoveGridSet';
import { COLORS, type Color as SetColorType, getColorForColorIndex, getColorStringForColorIndex } from '../utils/setColors';
import {
  LabeledSection,
  EditableTextField,
  VersionsSection,
  VersionInfo,
} from './SidebarComponents';


interface EditSetFormProps {
  set: ReactSetData;
  otherVersions: VersionInfo[];
  onUpdateSet: (updatedSet: Partial<ReactSetData>) => void;
}

export const EditSetForm: React.FC<EditSetFormProps> = ({
  set,
  otherVersions,
  onUpdateSet,
}) => {
  // --- Local State for Form Fields --- //
  const [localName, setLocalName] = useState(set.name);
  const [localAlias, setLocalAlias] = useState(set.alias ?? '');
  const [localColorIndex, setLocalColorIndex] = useState(set.colorIndex);
  // ------------------------------------ //

  // Internal state for version selection and locking
  const [selectedVersionId, setSelectedVersionId] = useState('current');
  const [lockedVersionId, setLockedVersionId] = useState<string | null>(null);

  // Reset internal state when the set prop changes
  useEffect(() => {
    setSelectedVersionId('current');
    setLockedVersionId(null);
    // Reset form fields when the set ID changes
    setLocalName(set.name);
    setLocalAlias(set.alias ?? '');
    setLocalColorIndex(set.colorIndex);
  }, [set.id, set.name, set.alias, set.colorIndex]); // Added dependencies

  // --- Field Change Handlers (Update Local State) ---
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalName(e.target.value);
  };
  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalAlias(e.target.value);
  };
  const handleColorChange = (colorIndexString: string) => {
    const newColorIndex = parseInt(colorIndexString, 10);
    if (!isNaN(newColorIndex)) {
      setLocalColorIndex(newColorIndex);
      onUpdateSet({ colorIndex: newColorIndex }); // Update parent immediately for color
    }
  };
  // ------------------------------------------------------ //

  // --- Blur Handlers (Propagate to Parent) ---
  const handleNameBlur = () => {
    if (localName !== set.name) { // Only update if changed
      onUpdateSet({ name: localName });
    }
  };
  const handleAliasBlur = () => {
    const currentAlias = set.alias ?? '';
    if (localAlias !== currentAlias) { // Only update if changed
      onUpdateSet({ alias: localAlias });
    }
  };
  // ------------------------------------------------------ //


  // --- Internal Handlers (Versioning - unchanged) --- //
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
        value={localName} // Use local state
        placeholder="Enter set name"
        onChange={handleNameChange} // Updates local state
        onBlur={handleNameBlur} // Propagates to parent
      />

      {/* Alias - Using EditableTextField */}
      <EditableTextField
        label="Alias on this page"
        value={localAlias} // Use local state
        placeholder="Enter alias (optional)"
        onChange={handleAliasChange} // Updates local state
        onBlur={handleAliasBlur} // Propagates to parent
      />

      {/* Color - Using LabeledSection */}
      <LabeledSection label="Color">
        <Flex align="center" gap="2">
          <Select.Root
            value={localColorIndex.toString()} // Use local state
            onValueChange={handleColorChange} // Updates local state & propagates
          >
            <Select.Trigger placeholder="Select color…" style={{ flexGrow: 1 }} />
            <Select.Content position="popper">
              {COLORS.map((color: SetColorType, index: number) => {
                const colorValueString = getColorStringForColorIndex(index); // Get string for display
                return (
                  <Select.Item key={index} value={index.toString()}>
                    <Flex align="center" gap="2">
                      <Box
                        width="12px"
                        height="12px"
                        style={{ backgroundColor: colorValueString, borderRadius: '50%' }}
                      />
                      {color.abletonName}
                    </Flex>
                  </Select.Item>
                );
              })}
            </Select.Content>
          </Select.Root>
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