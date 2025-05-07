import React, { useState, useMemo, useEffect } from 'react';
import {
  Flex,
  Select,
  Separator,
  Box,
} from '@radix-ui/themes';
import { ReactSetData } from './MoveGridSet';
import { COLORS, type Color as SetColorType, getColorForColorIndex, getColorIndexForColor, getColorStringForColorIndex } from '../utils/setColors';
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
  const handleColorChange = (colorValueString: string) => {
    console.log('Form: Color changed to value:', colorValueString);
    // Parse colorValueString 'var(--name-grade)' to find the matching color object
    const match = colorValueString.match(/var\(--(.*?)-(\d+)\)/);
    if (match) {
      const name = match[1];
      const grade = parseInt(match[2], 10);
      const selectedColorObject = COLORS.find(c => c.name === name && c.grade === grade);
      if (selectedColorObject) {
        const newColorIndex = getColorIndexForColor(selectedColorObject);
        console.log('Form: New color index:', newColorIndex);
        onUpdateSet({ colorIndex: newColorIndex });
        // If onUpdateSet also needs the color string for some reason:
        // onUpdateSet({ colorIndex: newColorIndex, color: colorValueString });
      } else {
        console.error('Could not find color object for:', colorValueString);
      }
    } else {
      console.error('Could not parse color string:', colorValueString);
    }
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
          <Select.Root
            value={set.colorIndex !== undefined ? set.colorIndex.toString() : ''}
            onValueChange={handleColorChange}
          >
            <Select.Trigger placeholder="Select color…" style={{ flexGrow: 1 }} />
            <Select.Content position="popper">
              {COLORS.map((color: SetColorType, index: number) => {
                const colorValue = `var(--${color.name}-${color.grade})`;
                return (
                  <Select.Item key={index} value={index.toString()}>
                    <Flex align="center" gap="2">
                      <Box
                        width="12px"
                        height="12px"
                        style={{ backgroundColor: colorValue, borderRadius: '50%' }}
                      />
                      {color.abletonName}
                    </Flex>
                  </Select.Item>
                );
              })}
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