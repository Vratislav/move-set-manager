import React from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  IconButton,
  Separator,
} from '@radix-ui/themes';
import { Cross1Icon } from '@radix-ui/react-icons';
import './Sidebar.css';

interface SidebarProps {
  title: string;
  idLabel?: string; // Make ID optional
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode; // Add children prop
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

export const Sidebar: React.FC<SidebarProps> = ({
  title,
  idLabel,
  isOpen,
  onClose,
  children,
}) => {
  return (
    <Box className={`sidebar ${isOpen ? 'open' : ''}`}>
      <Flex direction="column" gap="4" p="4" height="100%">
        {/* Header */}
        <Flex justify="between" align="center">
          <Heading size="5">{title}</Heading>
          <Flex align="center" gap="3">
            {idLabel && <Text size="1" color="gray">{idLabel}</Text>}
            <IconButton variant="ghost" color="gray" onClick={onClose} aria-label="Close sidebar">
              <Cross1Icon />
            </IconButton>
          </Flex>
        </Flex>

        <Separator size="4" />

        {/* Render whatever content is passed as children */}
        {children}

      </Flex>
    </Box>
  );
}; 