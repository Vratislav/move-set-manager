import React, { useState } from 'react';
import { Flex, Button, Select, Heading, IconButton } from '@radix-ui/themes';
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import { EditPageModal } from './EditPageModal';

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
  pages: Array<{ id: string; name: string }>;
  selectedPage: string | null;
  onSelectPage: (pageId: string) => void;
  onDuplicatePage: () => void;
  onUpdatePage: () => void;
  onUploadPage: () => void;
  onPageNameEdited: (newPageName: string) => void;
  onDeletePage: () => void;
  currentPageName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  pages,
  selectedPage,
  onSelectPage,
  onDuplicatePage,
  onUpdatePage,
  onUploadPage,
  onPageNameEdited,
  onDeletePage,
  currentPageName = ''
}) => {
  const [isEditPageModalOpen, setIsEditPageModalOpen] = useState(false);

  const handleEditName = () => {
    if (selectedPage) {
      setIsEditPageModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (selectedPage) {
      onDeletePage();
    }
  };

  return (
    <>
      <Flex direction="column" align="center" gap="3" mb="4">
        <Heading size="7">Move Manager</Heading>
        <Flex justify="between" align="center" width="100%" px="5">
          <Flex align="center" gap="2">
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
            <IconButton 
              variant="ghost" 
              color="gray" 
              onClick={handleEditName} 
              disabled={!selectedPage}
              aria-label="Edit page name"
            >
              <Pencil1Icon />
            </IconButton>
            <IconButton
              variant="ghost"
              color="red"
              onClick={handleDelete} 
              disabled={!selectedPage}
              aria-label="Delete page"
            >
              <TrashIcon />
            </IconButton>
          </Flex>

          <Flex gap="3">
            <ActionButton onClick={onDuplicatePage}>Duplicate page</ActionButton>
            <ActionButton onClick={onUpdatePage}>Download page from move</ActionButton>
            <ActionButton onClick={onUploadPage}>Upload page to move</ActionButton>
          </Flex>
        </Flex>
      </Flex>
      <EditPageModal
        isOpen={isEditPageModalOpen}
        onClose={() => setIsEditPageModalOpen(false)}
        currentPageName={currentPageName}
        onSavePageName={(newName) => {
          onPageNameEdited(newName);
          setIsEditPageModalOpen(false);
        }}
      />
    </>
  );
}; 