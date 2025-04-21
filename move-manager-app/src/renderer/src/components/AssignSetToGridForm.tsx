import React, { useState, useMemo } from 'react';
import {
  Flex,
  TextField,
  ScrollArea,
  Text,
  Box,
  Heading,
} from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { SetData } from './MoveGridSet';

interface AssignSetToGridFormProps {
  availableSets: SetData[];
  onAssignSet: (setId: string) => void;
}

export const AssignSetToGridForm: React.FC<AssignSetToGridFormProps> = ({
  availableSets,
  onAssignSet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSets = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      // Initially sort by name when no query
      return [...availableSets].sort((a, b) => a.name.localeCompare(b.name));
    }
    return availableSets
      .filter(
        (set) =>
          set.name.toLowerCase().includes(query) ||
          set.id.toLowerCase().includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name)); // Keep sorted
  }, [availableSets, searchQuery]);

  return (
    <Flex direction="column" gap="3" height="100%">
      <TextField.Root
        placeholder="Search by name or ID…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="2"
      >
        <TextField.Slot>
          <MagnifyingGlassIcon height="16" width="16" />
        </TextField.Slot>
      </TextField.Root>

      <Box style={{ flexGrow: 1, minHeight: 0 }}> {/* Ensure Box grows and allows ScrollArea to shrink */}        <ScrollArea type="auto" scrollbars="vertical" style={{ height: '100%' }}>
          <Flex direction="column" gap="2" pr="4"> {/* Padding for scrollbar */}
            {filteredSets.length > 0 ? (
              filteredSets.map((set) => (
                <Box
                  key={set.id}
                  onClick={() => onAssignSet(set.id)}
                  style={{
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-2)',
                    cursor: 'pointer',
                    backgroundColor: 'var(--gray-a2)',
                  }}
                >
                  <Flex justify="between" align="center">
                    <Text size="2" weight="medium">{set.name}</Text>
                    <Text size="1" color="gray">{set.id}</Text>
                  </Flex>
                </Box>
              ))
            ) : (
              <Text size="2" color="gray" align="center" mt="4">
                No matching sets found.
              </Text>
            )}
          </Flex>
        </ScrollArea>
      </Box>
    </Flex>
  );
}; 