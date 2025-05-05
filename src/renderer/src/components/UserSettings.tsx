import React, { useState, useEffect } from 'react';
import { Box, Flex, Heading, TextField, Button, Text, Checkbox, Separator } from '@radix-ui/themes';
import { FileTextIcon } from '@radix-ui/react-icons'; // Example icon
import { trpcClient } from '../trpc'; // Assuming trpcClient is set up for IPC
import type { UserSettings as UserSettingsType } from '../../../main/moveManagerLib/model/userSettings'; // Import the type for structure

// Define a more specific type for the subset of settings handled by this form
// Note: We only pass back the relevant fields, not the full UserSettingsType onSave
interface UserSettingsFormData {
  sshKeyPath: string;
  hasPassphrase: boolean;
  sshCustomHostname?: string;
  sshCustomPort?: number;
  sshCustomUsername?: string;
}

interface UserSettingsProps {
  // Pass initial settings if available
  initialSshKeyPath?: string;
  initialHasPassphrase?: boolean;
  initialSshCustomHostname?: string;
  initialSshCustomPort?: number;
  initialSshCustomUsername?: string;
  onSave: (settings: UserSettingsFormData) => void;
  onClose: () => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({
  initialSshKeyPath = '',
  initialHasPassphrase = false,
  initialSshCustomHostname = '',
  initialSshCustomPort,
  initialSshCustomUsername = '',
  onSave,
  onClose,
}) => {
  const [sshKeyPath, setSshKeyPath] = useState<string>(initialSshKeyPath);
  const [hasPassphrase, setHasPassphrase] = useState<boolean>(initialHasPassphrase);
  const [sshCustomHostname, setSshCustomHostname] = useState<string>(initialSshCustomHostname);
  // Port needs careful handling: store as string for input, parse for saving
  const [sshCustomPort, setSshCustomPort] = useState<string>(
    initialSshCustomPort !== undefined ? String(initialSshCustomPort) : ''
  );
  const [sshCustomUsername, setSshCustomUsername] = useState<string>(initialSshCustomUsername);

  // Update state if initial props change (e.g., data loaded after initial render)
  useEffect(() => {
    setSshKeyPath(initialSshKeyPath);
  }, [initialSshKeyPath]);

  useEffect(() => {
    setHasPassphrase(initialHasPassphrase);
  }, [initialHasPassphrase]);

  useEffect(() => {
    setSshCustomHostname(initialSshCustomHostname);
  }, [initialSshCustomHostname]);

  useEffect(() => {
    setSshCustomPort(initialSshCustomPort !== undefined ? String(initialSshCustomPort) : '');
  }, [initialSshCustomPort]);

  useEffect(() => {
    setSshCustomUsername(initialSshCustomUsername);
  }, [initialSshCustomUsername]);

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
    const portNumber = sshCustomPort.trim() === '' ? undefined : parseInt(sshCustomPort, 10);

    const settingsToSave: UserSettingsFormData = {
      sshKeyPath,
      hasPassphrase,
      sshCustomHostname: sshCustomHostname.trim() || undefined,
      sshCustomPort: portNumber,
      sshCustomUsername: sshCustomUsername.trim() || undefined,
    };
    console.log('Saving settings:', settingsToSave);
    onSave(settingsToSave);
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

      {/* Custom SSH Settings Section */}
      <Box>
          <Heading size="3" mb="2">Custom SSH Settings (Optional)</Heading>
          <Separator size="4" mb="3" />
          <Flex direction="column" gap="3">
              <Text size="2" weight="medium">Host</Text>
              <TextField.Root
                  placeholder="move.local"
                  value={sshCustomHostname}
                  onChange={(e) => setSshCustomHostname(e.target.value)}
              />
              <Text size="2" weight="medium">Port</Text>
              <TextField.Root
                  type="number" // Use number type for better input control
                  placeholder="22"
                  value={sshCustomPort}
                  onChange={(e) => setSshCustomPort(e.target.value.replace(/[^0-9]/g, ''))} // Allow only numbers
                  min="1"
                  max="65535"
              />
              <Text size="2" weight="medium">User</Text>
              <TextField.Root
                  placeholder="ableton"
                  value={sshCustomUsername}
                  onChange={(e) => setSshCustomUsername(e.target.value)}
              />
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