import React, { useState } from 'react';
import { Flex, Button, Select, Heading, IconButton } from '@radix-ui/themes';
import { Pencil1Icon, TrashIcon, CopyIcon } from '@radix-ui/react-icons';
import { EditPageModal } from './EditPageModal';
import './TopBar.css';

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ children, onClick, disabled }) => {
  return (
    <Button variant="soft" color="gray" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
};

interface TopBarProps {
  pages: Array<{ id: string; name: string }>;
  selectedPage: string | null;
  areAnySetsAvailable: boolean;
  onSelectPage: (pageId: string) => void;
  onCreateNewPage?: () => void;
  onDuplicatePage: () => void;
  onUpdatePage: () => void;
  onUploadPage: () => void;
  onPageNameEdited: (newPageName: string) => void;
  onDeletePage: () => void;
  currentPageName?: string;
  onDownloadAllAblBundles?: () => void;
}

const NEW_PAGE_SENTINEL = "__NEW_PAGE_SENTINEL__";

export const TopBar: React.FC<TopBarProps> = ({
  pages,
  selectedPage,
  areAnySetsAvailable,
  onSelectPage,
  onCreateNewPage,
  onDuplicatePage,
  onUpdatePage,
  onUploadPage,
  onPageNameEdited,
  onDeletePage,
  currentPageName = '',
  onDownloadAllAblBundles
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
        <Heading size="7">Move Set Manager</Heading>

        {/* New row for the Download All ABL Bundles button */}
        {onDownloadAllAblBundles && (
          <Flex justify="end" width="100%" px="5"> 
            <ActionButton onClick={onDownloadAllAblBundles}>
              Download all .ablbundles
            </ActionButton>
          </Flex>
        )}

        <Flex justify="between" align="center" width="100%" px="5">
          <Flex align="center" gap="2">
            <Select.Root 
              value={selectedPage || ''} 
              onValueChange={(value) => {
                if (value === NEW_PAGE_SENTINEL) {
                  if (onCreateNewPage) {
                    onCreateNewPage();
                  }
                } else {
                  onSelectPage(value);
                }
              }}
            >
              <Select.Trigger variant="soft" placeholder="Select a page…" />
              <Select.Content position="popper">
                {pages.map((page) => (
                  <Select.Item key={page.id} value={page.id}>
                    {page.name}
                  </Select.Item>
                ))}
                <Select.Separator />
                <Select.Item value={NEW_PAGE_SENTINEL}>
                  Create New Page...
                </Select.Item>
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
              color="gray"
              onClick={onDuplicatePage}
              disabled={!selectedPage}
              aria-label="Duplicate page"
            >
              <CopyIcon />
            </IconButton>
            <IconButton
              className="delete-icon-button"
              variant="ghost"
              color="gray"
              onClick={handleDelete} 
              disabled={!selectedPage}
              aria-label="Delete page"
            >
              <TrashIcon />
            </IconButton>
          </Flex>

          <Flex gap="3">
            <ActionButton onClick={onUpdatePage}>Download page from Move</ActionButton>
            <ActionButton onClick={onUploadPage} disabled={!areAnySetsAvailable}>Upload page to Move</ActionButton>
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