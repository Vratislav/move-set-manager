import React, { useState } from 'react';
import { Box, Text, IconButton } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import { getColorStringForColorIndex } from '../utils/setColors';

export interface ReactSetData {
  id: string;
  name: string;
  revision: string;
  colorIndex: number;
  alias?: string;
}

interface MoveGridSetProps {
  set: ReactSetData | null;
  onClick: () => void;
  onDelete: (setId: string) => void;
  isHighlighted: boolean;
}

export const MoveGridSet: React.FC<MoveGridSetProps> = ({ set, onClick, onDelete, isHighlighted }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick for the parent Box
    if (set) {
      onDelete(set.id);
    }
  };

  const bgColor = set ? getColorStringForColorIndex(set.colorIndex) : 'var(--gray-3)';
  const hoverBgColor = set ? 'var(--gray-a4)' : 'var(--gray-4)';

  return (
    <Box
      style={{
        position: 'relative',
        height: '100px', // Current height
        width: '100px', // Make width equal to height
        backgroundColor: isHovered ? hoverBgColor : bgColor,
        borderRadius: 'var(--radius-3)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isHighlighted ? 'calc(var(--space-2) - 1px)' : 'var(--space-2)',
        transition: 'background-color 0.1s ease-in-out',
        overflow: 'hidden',
        border: isHighlighted
          ? `2px solid var(--blue-a7)` // Highlight for selected
          : `1px solid ${set ? 'var(--gray-a5)' : 'var(--gray-a4)'}`, // Default border
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {set ? (
        <>
          <Text size="2" weight="bold" align="center" style={{ color: 'var(--gray-12)' }}>
            {set.name}
          </Text>
          {/* <Text size="1" style={{ color: 'var(--gray-11)' }}>
            ({set.revision})
          </Text> */}
          {isHovered && (
            <IconButton
              variant="ghost"
              color="red"
              highContrast
              size="1"
              style={{
                position: 'absolute',
                top: 'var(--space-1)',
                right: 'var(--space-1)',
              }}
              onClick={handleDelete}
              aria-label="Remove set"
            >
              <Cross2Icon />
            </IconButton>
          )}
        </>
      ) : (
        <Text size="1" style={{ color: 'var(--gray-9)' }}>
          Empty
        </Text>
      )}
    </Box>
  );
}; 