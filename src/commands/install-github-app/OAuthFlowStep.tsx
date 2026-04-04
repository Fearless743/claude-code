import React from 'react';
import { Box, Text } from '../../ink.js';

interface OAuthFlowStepProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

export function OAuthFlowStep({ onSuccess, onCancel }: OAuthFlowStepProps): React.ReactNode {
  void onSuccess;
  void onCancel;

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Create Authentication Token</Text>
      <Text dimColor>Creating a long-lived token for GitHub Actions</Text>
      <Box paddingLeft={1} flexDirection="column" gap={1}>
        <Text color="error">Anthropic online authentication has been removed from this build.</Text>
        <Text dimColor>Use a non-Anthropic GitHub authentication path instead.</Text>
        <Text dimColor>Press Esc to go back.</Text>
      </Box>
    </Box>
  );
}
