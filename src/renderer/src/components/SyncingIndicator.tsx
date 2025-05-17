import React from 'react';
import { Flex, Text } from '@radix-ui/themes';
import './SyncingIndicator.css'; // We'll create this next

interface SyncingIndicatorProps {
  message?: string;
}

export const SyncingIndicator: React.FC<SyncingIndicatorProps> = ({ message = "Syncing..." }) => {
  return (
    <Flex direction="column" align="center" justify="center" gap="4" py="5">
      <div className="spinner" />
      <Text size="5">{message}</Text>
    </Flex>
  );
}; 