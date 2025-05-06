import React from 'react';
import { Flex, Text, Button } from '@radix-ui/themes';

interface ErrorDisplayProps {
  errorMessage: string;
  onDismiss: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage, onDismiss }) => {
  return (
    <Flex direction="column" gap="4" align="center">
      <Text color="red" size="3" style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>
        {errorMessage}
      </Text>
      <Button onClick={onDismiss} color="gray" variant="soft">
        OK
      </Button>
    </Flex>
  );
}; 