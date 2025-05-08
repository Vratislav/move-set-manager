import React from 'react';
import { Flex, Heading, IconButton, Dialog } from '@radix-ui/themes';
import { Cross1Icon } from '@radix-ui/react-icons';
import './Modal.css'; // We'll need to create this CSS file

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, hideCloseButton = false }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content style={{ maxWidth: 550 }}> {/* Adjust width as needed */}
        <Flex justify="between" align="center" mb="4">
          <Dialog.Title>
            <Heading size="5">{title}</Heading>
          </Dialog.Title>
          {!hideCloseButton && (
            <Dialog.Close>
              <IconButton variant="ghost" color="gray" onClick={onClose} aria-label="Close modal">
                <Cross1Icon />
              </IconButton>
            </Dialog.Close>
          )}
        </Flex>

        {/* Content Area */}
        {children}

      </Dialog.Content>
    </Dialog.Root>
  );
}; 