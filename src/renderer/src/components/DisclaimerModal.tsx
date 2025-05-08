import React from 'react';
import { Modal } from './Modal';
import { Button, Text, Flex, Callout, Heading, Link as RadixLink, Code } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useGetUserSettings, useUpdateUserSettings } from '../queriesAndMutations';
import type { UserSettings as UserSettingsType } from '../../../main/moveManagerLib/model/userSettings';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void; // This will be called when the user agrees
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  const { data: userSettingsData } = useGetUserSettings();
  const updateUserSettingsMutation = useUpdateUserSettings();

  const handleAgree = () => {
    if (userSettingsData) {
      const updatedSettings: UserSettingsType = {
        ...userSettingsData,
        onboardingCompleted: true,
      };
      updateUserSettingsMutation.mutate(updatedSettings, {
        onSuccess: () => {
          onClose(); // Close the modal after successful update
        },
        onError: (error) => {
          // Handle error appropriately, maybe show a notification
          console.error("Failed to update onboarding status:", error);
          // Still close the modal or inform user of failure
          onClose();
        }
      });
    } else {
        // Fallback if userSettingsData is not available for some reason
        const fallbackSettings: UserSettingsType = {
            sshPrivateKeyPath: '',
            sshKeyHasPassphrase: false,
            sshCustomHostname: undefined,
            sshCustomPort: undefined,
            sshCustomUsername: undefined,
            onboardingCompleted: true,
        };
        updateUserSettingsMutation.mutate(fallbackSettings, {
            onSuccess: () => {
                onClose();
            },
            onError: (error) => {
                console.error("Failed to update onboarding status with fallback:", error);
                onClose();
            }
        });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Disclaimer & Setup Guide" hideCloseButton={true}>
      <Flex direction="column" style={{ height: '100%', maxHeight: '80vh' /* Overall max height for modal content */ }}>
        <Flex
          direction="column"
          gap="4"
          className="scrollable-content" // Added class for scrollbar styling
          style={{
            flexGrow: 1, // Allow this to take up available space
            overflowY: 'scroll', // Always show scrollbar track
            maxHeight: 'calc(100% - 70px)', // Adjust based on button area height
            paddingRight: 'var(--space-4)', // Space for scrollbar
            paddingLeft: 'var(--space-2)', // Minor left padding for symmetry
          }}
        >
          <Callout.Root color="yellow" variant="soft">
            <Callout.Icon>
              <ExclamationTriangleIcon />
            </Callout.Icon>
            <Callout.Text>
              This tool is third-party and requires SSH access. That means:
              <ul>
                <li>There's a real risk of breaking things, including potentially <b>bricking your Ableton Move</b>.</li>
                <li>Ableton can't offer individual support if something goes wrong.</li>
                <li>If issues do arise, the documented restore procedure is the fallback – You use this at your own risk. Information on this procedure can be found in Center Code under <RadixLink href="https://ableton.centercode.com/project/article/item.html?cap=ecd3942a1fe3405eb27a806608401a0b&arttypeid=%7Be70be312-f44a-418b-bb74-ed1030e3a49a%7D&artid=%7BC0A2D9E2-D52F-4DEB-8BEE-356B65C8942E%7D" target="_blank" rel="noopener noreferrer">Documentation</RadixLink>.</li>
                <li>The author of this tool is not responsible for any damages caused to your equipment or for any potential data loss.</li>
              </ul>
            </Callout.Text>
          </Callout.Root>

          <Heading size="3" mt="2">How to Get This Working</Heading>

          <Heading size="2" mt="1">SSH</Heading>
          <Text as="p">
            Add an SSH key without passphrase at <RadixLink href="http://move.local/development/ssh" target="_blank" rel="noopener noreferrer">http://move.local/development/ssh</RadixLink>
          </Text>
          <Text as="p">Steps:</Text>
          <ol style={{ paddingLeft: '20px', margin: '0px' }}>
            <li>If you do not already have an SSH key in <Code>~/.ssh</Code>, generate one. Steps can be found, for instance, at <RadixLink href="https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent" target="_blank" rel="noopener noreferrer">GitHub's documentation</RadixLink>.</li>
            <li>Add the contents of your public key (e.g., <Code>id_rsa.pub</Code>) to the submission form at <RadixLink href="http://move.local/development/ssh" target="_blank" rel="noopener noreferrer">http://move.local/development/ssh</RadixLink>. You can now log in via your choice of SSH client.</li>
            <li>Set the path to your SSH private key in Move Set Manager settings (Gear Icon top right).</li>
          </ol>

          <Heading size="2" mt="3">Git</Heading>
          <Text as="p">
            This software uses Git for versioning your sets. Make sure <RadixLink href="https://git-scm.com" target="_blank" rel="noopener noreferrer">Git</RadixLink> is installed and available in the command line.
          </Text>
        </Flex>
        <Flex
          justify="center"
          style={{
            flexShrink: 0, // Prevent this area from shrinking
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--gray-a5)', // Separator line
            marginTop: 'auto', // Pushes to bottom if content is short, works with parent Flex
          }}
        >
          <Button color="green" size="3" onClick={handleAgree}>
            Ok, I understand and Agree
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

// Add some basic scrollbar styling - this might need to go in a global CSS file or a specific CSS module if not working inline or if more complex styling is needed.
// For now, let's assume a way to inject this. If this was a .css file for the component:
/*
.scrollable-content::-webkit-scrollbar {
  width: 10px;
}
.scrollable-content::-webkit-scrollbar-track {
  background: var(--gray-a3);
  border-radius: 10px;
}
.scrollable-content::-webkit-scrollbar-thumb {
  background-color: var(--gray-a8);
  border-radius: 10px;
  border: 2px solid var(--gray-a3);
}
.scrollable-content::-webkit-scrollbar-thumb:hover {
  background-color: var(--gray-a9);
}
*/ 