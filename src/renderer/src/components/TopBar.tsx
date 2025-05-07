import React from 'react';
import { Flex, Button, Select, Text, Heading } from '@radix-ui/themes';
import { CaretDownIcon } from '@radix-ui/react-icons';

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ children, onClick }) => {
  return (
    <Button variant="soft" color="gray" onClick={onClick}>
      {children}
    </Button>
  );
};

interface TopBarProps {
  pages: Array<{ id: string; name: string }>; // Updated: Array of page objects
  selectedPage: string | null; // Updated: page ID, can be null
  onSelectPage: (pageId: string) => void; // Updated: expects page ID
  onDuplicatePage: () => void;
  onUpdatePage: () => void;
  onUploadPage: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  pages,
  selectedPage,
  onSelectPage,
  onDuplicatePage,
  onUpdatePage,
  onUploadPage,
}) => {
  return (
    <Flex direction="column" align="center" gap="3" mb="4">
      <Heading size="7">Move Manager</Heading>
      <Flex justify="between" align="center" width="100%" px="5">
        <Select.Root value={selectedPage || ''} onValueChange={onSelectPage}>
          <Select.Trigger variant="soft" placeholder="Select a page…" />
          <Select.Content position="popper">
            {pages.map((page) => (
              <Select.Item key={page.id} value={page.id}>
                {page.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Flex gap="3">
          <ActionButton onClick={onDuplicatePage}>Duplicate page</ActionButton>
          <ActionButton onClick={onUpdatePage}>Download page from move</ActionButton>
          <ActionButton onClick={onUploadPage}>Upload page to move</ActionButton>
        </Flex>
      </Flex>
    </Flex>
  );
}; 