import { ipcLink } from 'electron-trpc/renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { trpcReact } from './trpc';
import { Flex, Box } from '@radix-ui/themes';
import { TopBar } from './components/TopBar';
import { MoveGrid } from './components/MoveGrid';
import { Sidebar } from './components/Sidebar';
import { SetData } from './components/MoveGridSet';
import './App.css'; // Import global styles

// --- Mock Data --- //
const mockPages = ['Page 1', 'Page 2', 'Empty Page'];

const generateMockSets = (pageName: string): (SetData | null)[] => {
  if (pageName === 'Empty Page') {
    return Array(32).fill(null);
  }
  const colors = [
    'var(--cyan-a7)',
    'var(--blue-a7)',
    'var(--green-a7)',
    'var(--orange-a7)',
    'var(--red-a7)',
    'var(--purple-a7)',
    'var(--yellow-a7)',
    'var(--pink-a7)'
  ];
  const sets: (SetData | null)[] = Array(32).fill(null);
  for (let i = 0; i < 15; i++) {
    // Sprinkle some sets randomly
    const index = Math.floor(Math.random() * 32);
    if (sets[index] === null) {
      const setId = `${pageName.replace(' ', '')}-Set${i + 1}`;
      sets[index] = {
        id: setId,
        name: `Set ${i + 1}`,
        revision: `rev${Math.floor(Math.random() * 5) + 1}`,
        color: colors[i % colors.length],
        alias: Math.random() > 0.7 ? `Alias ${i}` : undefined,
      };
    }
  }
  // Ensure at least one specific set for testing sidebar
  if (pageName === 'Page 1' && sets[5] === null) {
    sets[5] = { id: 'P1-TestSet', name: 'Test Set', revision: 'revT', color: 'var(--blue-a7)' };
  }
  if (pageName === 'Page 2' && sets[10] === null) {
    sets[10] = { id: 'P2-AnotherSet', name: 'Another One', revision: 'revA', color: 'var(--green-a7)', alias: 'DJ Khaled' };
  }
  return sets;
};
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

  const handleSelectPage = (page: string) => {
    setSelectedPage(page);
    setCurrentPageSets(generateMockSets(page));
    setSelectedSet(null); // Close sidebar when changing page
    setIsSidebarOpen(false);
    console.log(`Selected page: ${page}`);
  };

  const handleSetClick = (set: SetData) => {
    setSelectedSet(set);
    setIsSidebarOpen(true);
    console.log(`Selected set: ${set.name}`);
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
              onSetClick={handleSetClick}
              onDeleteSet={handleDeleteSet}
            />
          </Flex>

          <Sidebar
            selectedSet={selectedSet}
            isOpen={isSidebarOpen}
            onClose={handleCloseSidebar}
            onUpdateSet={handleUpdateSet} // Pass mock update handler
          />
        </Box>
      </QueryClientProvider>
    </trpcReact.Provider>
  );
}

export default App;
