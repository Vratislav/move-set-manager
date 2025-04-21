import { ipcLink } from 'electron-trpc/renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { trpcReact } from './trpc';
import { Flex, Box } from '@radix-ui/themes';
import { TopBar } from './components/TopBar';
import { MoveGrid } from './components/MoveGrid';
import { Sidebar } from './components/Sidebar';
import { EditSetForm } from './components/EditSetForm';
import { AssignSetToGridForm } from './components/AssignSetToGridForm';
import { SetData } from './components/MoveGridSet';
import { VersionInfo } from './components/SidebarComponents';
import './App.css'; // Import global styles

// --- Mock Data --- //
const mockPages = ['Page 1', 'Page 2', 'Empty Page'];

// Generate a larger pool of potential sets
const allPossibleSets: SetData[] = Array.from({ length: 50 }, (_, i) => {
  const colors = ['cyan', 'blue', 'green', 'orange', 'red', 'purple', 'yellow', 'pink'];
  const colorName = colors[i % colors.length];
  return {
    id: `Set-${i + 1}`,
    name: `Awesome Set ${i + 1}`,
    revision: `rev${Math.floor(Math.random() * 10)}`,
    color: `var(--${colorName}-a7)`,
    alias: Math.random() > 0.8 ? `Alias ${i}` : undefined,
  };
});

const generateMockSets = (pageName: string): (SetData | null)[] => {
  if (pageName === 'Empty Page') {
    return Array(32).fill(null);
  }
  const sets: (SetData | null)[] = Array(32).fill(null);
  // Sprinkle some sets from the pool onto the page
  const setsForThisPage = [...allPossibleSets].sort(() => 0.5 - Math.random()).slice(0, 15); // Take 15 random sets
  let placedCount = 0;
  while (placedCount < setsForThisPage.length) {
    const index = Math.floor(Math.random() * 32);
    if (sets[index] === null) {
      sets[index] = setsForThisPage[placedCount];
      placedCount++;
    }
  }
  return sets;
};

// Mock data for other versions - Moved here from Sidebar
const mockOtherVersions: VersionInfo[] = [
  { id: 'punchy-d324c', name: 'Make it more punchy', revision: '(d324c)', isLockable: true },
];
// ----------------- //

function App(): React.JSX.Element {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [ipcLink()],
    }),
  );

  const [selectedPage, setSelectedPage] = useState<string>(mockPages[0]);
  const [currentPageSets, setCurrentPageSets] = useState<(SetData | null)[]>(() => generateMockSets(selectedPage));
  const [selectedSet, setSelectedSet] = useState<SetData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarMode, setSidebarMode] = useState<'edit' | 'assign' | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const handleSelectPage = (page: string) => {
    setSelectedPage(page);
    setCurrentPageSets(generateMockSets(page));
    setSelectedSet(null); // Close sidebar when changing page
    setIsSidebarOpen(false);
    setSidebarMode(null);
    setSelectedSlotIndex(null);
    console.log(`Selected page: ${page}`);
  };

  const handleSlotClick = (index: number, set: SetData | null) => {
    if (set) {
      // Clicked on a slot with a set -> Edit mode
      setSelectedSet(set);
      setSidebarMode('edit');
      setSelectedSlotIndex(null); // Not needed for edit mode
      console.log(`Selected set for editing: ${set.name} at index ${index}`);
    } else {
      // Clicked on an empty slot -> Assign mode
      setSelectedSet(null); // No specific set selected
      setSidebarMode('assign');
      setSelectedSlotIndex(index); // Remember which slot to assign to
      console.log(`Selected empty slot for assignment at index ${index}`);
    }
    setIsSidebarOpen(true);
  };

  const handleDeleteSet = (setId: string) => {
    setCurrentPageSets((prevSets) => prevSets.map(s => (s?.id === setId ? null : s)));
    // If the deleted set was the selected one, close the sidebar
    if (selectedSet?.id === setId) {
      setSelectedSet(null);
      setIsSidebarOpen(false);
    }
    console.log(`Deleted set: ${setId}`);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSidebarMode(null);
    setSelectedSlotIndex(null);
    // Optionally deselect the set when closing?
    // setSelectedSet(null);
  };

  // Mock handlers for TopBar actions
  const handleDuplicatePage = () => console.log('Duplicate page clicked');
  const handleUpdatePage = () => console.log('Update page from move clicked');
  const handleUploadPage = () => console.log('Upload page to move clicked');
  const handleUpdateSet = (updatedSet: Partial<SetData>) => {
    console.log('Update set (from sidebar - placeholder):', updatedSet);
    // In a real app, you'd update the state:
    // setCurrentPageSets(prev => prev.map(s => s?.id === selectedSet?.id ? { ...s, ...updatedSet } : s));
    // setSelectedSet(prev => prev ? { ...prev, ...updatedSet } : null);
  };

  // Handler for assigning a set from the AssignSetToGridForm
  const handleAssignSet = (setId: string) => {
    if (selectedSlotIndex === null) return; // Should not happen

    const set_to_assign = allPossibleSets.find(s => s.id === setId);
    if (!set_to_assign) return; // Set not found in available sets

    console.log(`Assigning set ${setId} (${set_to_assign.name}) to slot index ${selectedSlotIndex}`);

    // Update the grid state (replace null at selectedSlotIndex with the chosen set)
    setCurrentPageSets(prevSets => {
      const newSets = [...prevSets];
      // Basic check: ensure the set isn't already on this page in another slot
      if (newSets.some(s => s?.id === setId)) {
         console.warn(`Set ${setId} is already on this page.`);
         // Potentially show user feedback here
         return prevSets; // Don't assign if already present
      }
      newSets[selectedSlotIndex] = set_to_assign;
      return newSets;
    });

    // Close the sidebar after assignment
    handleCloseSidebar();
  };

  // Determine available sets (those in allPossibleSets but not in currentPageSets)
  const availableSetsForAssignment = useMemo(() => {
    const currentSetIds = new Set(currentPageSets.filter(s => s !== null).map(s => s!.id));
    return allPossibleSets.filter(s => !currentSetIds.has(s.id));
  }, [currentPageSets]);

  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* We wrap the main content and sidebar potentially */}
        {/* Using Box for now, might need more sophisticated layout later */}
        <Box style={{ position: 'relative', minHeight: '100vh' }}>
          <Flex direction="column" gap="4" p="4">
            <TopBar
              pages={mockPages}
              selectedPage={selectedPage}
              onSelectPage={handleSelectPage}
              onDuplicatePage={handleDuplicatePage}
              onUpdatePage={handleUpdatePage}
              onUploadPage={handleUploadPage}
            />
            <MoveGrid
              sets={currentPageSets}
              onSlotClick={handleSlotClick}
              onDeleteSet={handleDeleteSet}
            />
          </Flex>

          {/* Sidebar now wraps the content (EditSetForm or AssignSetToGridForm) */}
          <Sidebar
            title={sidebarMode === 'edit' ? 'Set Details' : sidebarMode === 'assign' ? 'Assign Set to Slot' : ''}
            idLabel={sidebarMode === 'edit' && selectedSet ? `id: ${selectedSet.id}` : undefined}
            isOpen={isSidebarOpen}
            onClose={handleCloseSidebar}
          >
            {/* Conditionally render correct form based on sidebarMode */}
            {sidebarMode === 'edit' && selectedSet && (
              <EditSetForm
                key={selectedSet.id}
                set={selectedSet}
                otherVersions={mockOtherVersions}
                onUpdateSet={handleUpdateSet}
              />
            )}
            {sidebarMode === 'assign' && (
              <AssignSetToGridForm
                availableSets={availableSetsForAssignment}
                onAssignSet={handleAssignSet}
              />
            )}
          </Sidebar>
        </Box>
      </QueryClientProvider>
    </trpcReact.Provider>
  );
}

export default App;
