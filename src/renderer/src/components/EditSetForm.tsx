import React, { useState, useEffect, useMemo } from 'react';
import {
  Flex,
  Select,
  Separator,
  Box,
  Button,
} from '@radix-ui/themes';
import { ReactSetData } from './MoveGridSet';
import { COLORS, type Color as SetColorType, getColorStringForColorIndex } from '../utils/setColors';
import {
  LabeledSection,
  EditableTextField,
  VersionsSection,
  VersionInfo,
} from './SidebarComponents';

interface EditSetFormProps {
  set: ReactSetData;
  otherVersions: VersionInfo[];
  onUpdateSet: (id: string, updatedSet: Partial<ReactSetData>) => void;
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

  // --- Internal state for version selection and locking --- //
  const [selectedVersionId, setSelectedVersionId] = useState('current');
  const [lockedVersionId, setLockedVersionId] = useState<string | null>(null);
  // ------------------------------------------------------ //

  // Reset internal state and form fields when the set prop changes
  useEffect(() => {
    setLocalName(set.name);
    setLocalAlias(set.alias ?? '');
    setLocalColorIndex(set.colorIndex);
    setSelectedVersionId('current');
    setLockedVersionId(null);
  }, [set]);

  // --- Field Change Handlers (Update Local State Only) ---
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
    }
  };
  // ------------------------------------------------------ //

  // --- Determine if form has changes --- //
  const isChanged = useMemo(() => {
    return localName !== set.name || localAlias !== (set.alias ?? '') || localColorIndex !== set.colorIndex;
  }, [localName, localAlias, localColorIndex, set.name, set.alias, set.colorIndex]);
  // ------------------------------------------------------ //

  // --- Save Handler (Propagate all changes to Parent) ---
  const handleSaveChanges = () => {
    const updates: Partial<ReactSetData> = {};
    if (localName !== set.name) updates.name = localName;
    const originalAlias = set.alias ?? '';
    if (localAlias !== originalAlias) {
      updates.alias = localAlias === '' ? undefined : localAlias;
    }
    if (localColorIndex !== set.colorIndex) updates.colorIndex = localColorIndex;

    if (Object.keys(updates).length > 0) {
      onUpdateSet(set.id, updates);
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
    <Flex direction="column" style={{ height: '100%' }}>
      {/* Scrollable area for form fields */}
      <Box style={{ flexGrow: 1, overflowY: 'auto' }}>
        {/* Form content container - p="0" because Sidebar provides overall padding */}
        <Flex direction="column" gap="4" p="0">
          <EditableTextField
            label="Set name"
            value={localName}
            placeholder="Enter set name"
            onChange={handleNameChange}
          />
          <EditableTextField
            label="Alias on this page"
            value={localAlias}
            placeholder="Enter alias (optional)"
            onChange={handleAliasChange}
          />
          <LabeledSection label="Color">
            <Flex align="center" gap="2">
              <Select.Root
                value={localColorIndex.toString()}
                onValueChange={handleColorChange}
              >
                <Select.Trigger placeholder="Select color…" style={{ flexGrow: 1 }} />
                <Select.Content position="popper">
                  {COLORS.map((color: SetColorType, index: number) => {
                    const colorValueString = getColorStringForColorIndex(index);
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
          {/*
          <VersionsSection
            currentRevision={set.revision}
            otherVersions={otherVersions}
            selectedVersionId={selectedVersionId}
            lockedVersionId={lockedVersionId}
            onVersionChange={handleVersionChange}
            onLockVersionToggle={handleLockVersionToggle}
          />
          */}
        </Flex>
      </Box>

      {/* Sticky Save Button Area */}
      <Box
        style={{
          position: 'sticky',
          bottom: 0,
          paddingTop: 'var(--space-4)',
          paddingBottom: 'var(--space-1)',
          background: 'var(--color-panel-solid)', // Or a more specific theme variable if available
          borderTop: '1px solid var(--gray-a5)',
          zIndex: 1,
        }}
      >
        <Flex justify="center">
          <Button onClick={handleSaveChanges} disabled={!isChanged} variant="solid" size="3" style={{ width: '100%' }}>
            Save Changes
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}; 