import React from 'react';
import { Grid } from '@radix-ui/themes';
import { MoveGridSet, SetData } from './MoveGridSet';

interface MoveGridProps {
  sets: (SetData | null)[]; // Array of 32 sets or null for empty slots
  onSlotClick: (index: number, set: SetData | null) => void; // Pass index and set/null
  onDeleteSet: (setId: string) => void;
  highlightedIndex: number | null; // Index of the slot to highlight
}

export const MoveGrid: React.FC<MoveGridProps> = ({
  sets,
  onSlotClick,
  onDeleteSet,
  highlightedIndex,
}) => {
  if (sets.length !== 32) {
    console.error('MoveGrid requires exactly 32 sets (including null for empty slots).');
    // Render placeholder or error state
    return <div>Error: Invalid number of sets provided to MoveGrid.</div>;
  }

  return (
    <Grid columns="8" gap="3" width="auto" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {sets.map((set, index) => (
        <MoveGridSet
          key={set ? set.id : `empty-${index}`}
          set={set}
          onClick={() => onSlotClick(index, set)} // Always trigger, pass index and set/null
          onDelete={onDeleteSet}
          isHighlighted={index === highlightedIndex} // Highlight based on index
        />
      ))}
    </Grid>
  );
}; 