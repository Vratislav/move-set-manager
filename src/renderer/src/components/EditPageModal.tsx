import React, { useState, useEffect } from 'react';
import { Flex, Heading, IconButton, Dialog, TextField, Button } from '@radix-ui/themes';
import { Cross1Icon } from '@radix-ui/react-icons';

interface EditPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageName: string;
  onSavePageName: (newPageName: string) => void;
}

export const EditPageModal: React.FC<EditPageModalProps> = ({
  isOpen,
  onClose,
  currentPageName,
  onSavePageName,
}) => {
  const [newPageName, setNewPageName] = useState(currentPageName);

  useEffect(() => {
    if (isOpen) {
      setNewPageName(currentPageName);
    }
  }, [isOpen, currentPageName]);

  const handleSave = () => {
    if (newPageName.trim() && newPageName.trim() !== currentPageName) {
      onSavePageName(newPageName.trim());
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Flex justify="between" align="center" mb="4">
          <Dialog.Title>
            <Heading size="5">Edit Page Name</Heading>
          </Dialog.Title>
          <Dialog.Close>
            <IconButton variant="ghost" color="gray" onClick={onClose} aria-label="Close modal">
              <Cross1Icon />
            </IconButton>
          </Dialog.Close>
        </Flex>

        <Flex direction="column" gap="3">
          <TextField.Root
            placeholder="Enter new page name"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            autoFocus
          />
          <Flex gap="3" justify="end">
            <Button variant="soft" color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!newPageName.trim() || newPageName.trim() === currentPageName}>
              Save
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}; 