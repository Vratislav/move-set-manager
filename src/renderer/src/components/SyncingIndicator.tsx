import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import './SyncingIndicator.css'; // We'll create this next

export const SyncingIndicator: React.FC = () => {
  return (
    <Flex direction="column" align="center" justify="center" gap="4" py="5">
      <div className="spinner" />
      <Text size="5">Syncing...</Text>
    </Flex>
  );
}; 