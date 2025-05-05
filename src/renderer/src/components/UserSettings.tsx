import React, { useState } from 'react';
import { Box, Flex, Heading, TextField, Button, Text, Checkbox, Separator } from '@radix-ui/themes';
import { FileTextIcon } from '@radix-ui/react-icons'; // Example icon
import { trpcClient } from '../trpc'; // Assuming trpcClient is set up for IPC

interface UserSettingsProps {
  // Pass initial settings if available
  initialSshKeyPath?: string;
  initialHasPassphrase?: boolean;
  onSave: (settings: { sshKeyPath: string; hasPassphrase: boolean }) => void;
  onClose: () => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({
  initialSshKeyPath = '',
  initialHasPassphrase = false,
  onSave,
  onClose,
}) => {
  const [sshKeyPath, setSshKeyPath] = useState<string>(initialSshKeyPath);
  const [hasPassphrase, setHasPassphrase] = useState<boolean>(initialHasPassphrase);

  const handleSelectFile = async () => {
    try {
      // We need to define 'selectSshKeyFile' in the main process tRPC router
      const result = await trpcClient.openSSHKeyFileSelectionDialog.mutate();
      if (result) {
        setSshKeyPath(result);
        console.log('Selected SSH key file:', result);
      } else {
        console.log('File selection cancelled.');
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      // Handle error display to user if needed
    }
  };

  const handleSaveChanges = () => {
    console.log('Saving settings:', { sshKeyPath, hasPassphrase });
    // In a real app, call a mutation to save settings
    // await trpcClient.saveUserSettings.mutate({ sshKeyPath, hasPassphrase });
    onSave({ sshKeyPath, hasPassphrase }); // Notify parent (App)
    // onClose(); // Parent (App) handles closing via onSave -> setIsOpen(false)
  };

  return (
    <Flex direction="column" gap="4">
      {/* SSH Key Section */}
      <Box>
        <Heading size="3" mb="2">SSH Key</Heading>
        <Separator size="4" mb="3" />
        <Flex direction="column" gap="3">
          <Text size="2" weight="medium">Path to private key</Text>
          <Flex gap="2" align="center">
            <TextField.Root
              placeholder="/path/to/your/id_rsa"
              value={sshKeyPath}
              onChange={(e) => setSshKeyPath(e.target.value)}
              style={{ flexGrow: 1 }}
            />
            <Button variant="soft" color="gray" onClick={handleSelectFile}>
               ...
            </Button>
          </Flex>
          <Flex asChild align="center" gap="2">
            <label>
              <Checkbox
                checked={hasPassphrase}
                onCheckedChange={(checked) => setHasPassphrase(Boolean(checked))}
              />
              <Text size="2">SSH Key has a passphrase</Text>
            </label>
          </Flex>
        </Flex>
      </Box>

      <Separator size="4" mt="2" mb="2" />

      {/* Action Buttons */}
      <Flex justify="end" gap="3">
        {/* Close button is handled by the Modal header 'X' */}
        {/* <Button variant="soft" color="gray" onClick={onClose}>Cancel</Button> */}
        <Button color="green" onClick={handleSaveChanges}>
          Save and close
        </Button>
      </Flex>
    </Flex>
  );
}; 