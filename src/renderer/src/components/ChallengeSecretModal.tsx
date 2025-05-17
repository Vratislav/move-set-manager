import React, { useState, useEffect } from 'react';
import { Flex, Button, Text, Dialog, TextField, Heading } from '@radix-ui/themes';

interface ChallengeSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (secret: string) => void;
  title?: string;
  message?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
}

export const ChallengeSecretModal: React.FC<ChallengeSecretModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Enter Challenge Secret",
  message = "Please enter the secret code displayed on your Ableton Move device.",
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  isLoading = false,
}) => {
  const [secret, setSecret] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSecret(''); // Clear secret when modal opens
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    if (secret.trim()) {
      onSubmit(secret.trim());
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>
            <Heading size="5">{title}</Heading>
        </Dialog.Title>
        
        <Text as="p" size="2" mb="4">
          {message}
        </Text>

        <TextField.Root
          placeholder="Enter secret code…"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          mb="4"
          disabled={isLoading}
        />

        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" color="gray" onClick={onClose} disabled={isLoading}>
            {cancelButtonText}
          </Button>
          <Button 
            variant="solid" 
            onClick={handleSubmit} 
            disabled={isLoading || !secret.trim()}
          >
            {isLoading ? 'Submitting...' : submitButtonText}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}; 