import { ipcLink } from 'electron-trpc/renderer';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react';
import { trpcClient } from './trpc';
import { Flex, Box, IconButton, Text, Badge } from '@radix-ui/themes';
import { GearIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { TopBar } from './components/TopBar';
import { MoveGrid } from './components/MoveGrid';
import { Sidebar } from './components/Sidebar';
import { EditSetForm } from './components/EditSetForm';
import { AssignSetToGridForm } from './components/AssignSetToGridForm';
import { Modal } from './components/Modal';
import { UserSettings } from './components/UserSettings';
import { ReactSetData } from './components/MoveGridSet';
import { VersionInfo } from './components/SidebarComponents';
import './App.css'; // Import global styles
import { useGetUserSettings, useUpdateUserSettings, useGetAllPages } from './queriesAndMutations';
import type { UserSettings as UserSettingsType } from '../../main/moveManagerLib/model/userSettings'; // Import the type

// --- Mock Data --- //
// const mockPages = ['Page 1', 'Page 2', 'Empty Page']; // Removed mock pages

// Generate a larger pool of potential sets
const allPossibleSets: ReactSetData[] = Array.from({ length: 50 }, (_, i) => {
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

const generateMockSets = (pageName: string): (ReactSetData | null)[] => {
  if (pageName === 'Empty Page') {
    return Array(32).fill(null);
  }
  const sets: (ReactSetData | null)[] = Array(32).fill(null);
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
  // --- Data Fetching --- //
  const {data: dataDevices} = useQuery({queryKey: ['devices'], queryFn: async () => {
    console.log('Fetching devices')
    const devices = await trpcClient.getAllDevices.query()
    return devices
  }})
  if(dataDevices){
    console.log('-------------DEVICES---------------')
    console.log(dataDevices)  
  }

  const { data: dataPages, isLoading: isLoadingPages, error: errorPages } = useGetAllPages(); // Fetch pages
  const { data: userSettingsData } = useGetUserSettings();
  const updateUserSettingsMutation = useUpdateUserSettings(); // Call hook at top level

  // --- State --- //
  // Derive pages from fetched data, providing an empty array as a fallback
  const pages = useMemo(() => dataPages?.map(p => p.name) ?? [], [dataPages]);

  // Select the first page from the fetched data, or empty string if none exist or still loading
  const [selectedPage, setSelectedPage] = useState<string>('');

  // Update selected page when pages load
  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
        setSelectedPage(pages[0]);
    }
  }, [pages, selectedPage]);

  // Initialize page sets based on the potentially updated selectedPage
  const [currentPageSets, setCurrentPageSets] = useState<(ReactSetData | null)[]>(() => {
    // Use the initially derived selectedPage if available, otherwise wait
    const initialPage = pages.length > 0 ? pages[0] : '';
    return generateMockSets(initialPage);
  });
  const [selectedSet, setSelectedSet] = useState<ReactSetData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarMode, setSidebarMode] = useState<'edit' | 'assign' | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Update current page sets when selected page changes *after* initial load
  useEffect(() => {
      if (selectedPage) { // Only run if selectedPage is set (i.e., pages have loaded or user selected one)
          setCurrentPageSets(generateMockSets(selectedPage));
          setSelectedSet(null);
          setIsSidebarOpen(false);
          setSidebarMode(null);
          setSelectedSlotIndex(null);
          console.log(`Selected page: ${selectedPage}`);
      }
  }, [selectedPage]);

  const handleSelectPage = (page: string) => {
    setSelectedPage(page);
    setCurrentPageSets(generateMockSets(page));
    setSelectedSet(null); // Close sidebar when changing page
    setIsSidebarOpen(false);
    setSidebarMode(null);
    setSelectedSlotIndex(null);
    console.log(`Selected page: ${page}`);
  };

  const handleSlotClick = (index: number, set: ReactSetData | null) => {
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
  const handleUpdateSet = (updatedSet: Partial<ReactSetData>) => {
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

  // Determine which grid index should be highlighted
  const highlightedIndex = useMemo(() => {
    if (sidebarMode === 'edit' && selectedSet) {
      // Find the index of the selected set in the current page grid
      return currentPageSets.findIndex(s => s?.id === selectedSet.id);
    }
    if (sidebarMode === 'assign') {
      return selectedSlotIndex;
    }
    return null; // No highlight if sidebar is closed or mode is null
  }, [sidebarMode, selectedSet, selectedSlotIndex, currentPageSets]);

  // --- Settings Modal Handlers and data --- //
  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true);
    console.log('Opening settings modal');
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
    console.log('Closing settings modal');
  };

  const handleSaveSettings = (settings) => {
    console.log('Settings saved in App:', settings);

    // Construct the full UserSettingsType object expected by the mutation
    const settingsToSave: UserSettingsType = { 
      sshPrivateKeyPath: settings.sshKeyPath,
      sshKeyHasPassphrase: settings.hasPassphrase,
      // Include new custom settings, falling back to undefined if not provided
      sshCustomHostname: settings.sshCustomHostname,
      sshCustomPort: settings.sshCustomPort,
      sshCustomUsername: settings.sshCustomUsername,
      // Preserve existing onboarding status or default
      onboardingCompleted: userSettingsData?.onboardingCompleted ?? true,
    };

    // Call the mutate function provided by the top-level hook
    updateUserSettingsMutation.mutate(settingsToSave);

    handleCloseSettingsModal(); // Close modal after save
  };

  return (
    <>
        {/* We wrap the main content and sidebar potentially */}
        {/* Using Box for now, might need more sophisticated layout later */}
        <Box style={{ position: 'relative', minHeight: '100vh' }}>
          {/* Settings Button and Conditional Warning - Top Right */}
          <Flex
            gap="2"
            align="center"
            style={{ position: 'absolute', top: 'var(--space-5)', right: 'var(--space-4)', zIndex: 10 }}
          >
            {/* Conditional Warning Label */}
            {userSettingsData && !userSettingsData.sshPrivateKeyPath && (
              <Badge color="yellow" variant="soft" size="2">
                <Flex gap="1" align="center">
                  <ExclamationTriangleIcon width="14" height="14" />
                  <Text size="2">No SSH Key path set! Set it here →</Text>
                </Flex>
              </Badge>
            )}
            {/* Settings Button */}
            <IconButton
              variant="ghost"
              color="gray"
              size="3"
              onClick={handleOpenSettingsModal}
              aria-label="Open settings"
            >
              <GearIcon width="20" height="20" />
            </IconButton>
          </Flex>

          <Flex direction="column" gap="4" p="4">
            <TopBar
              pages={pages} // Use fetched pages
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
              highlightedIndex={highlightedIndex}
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

          {/* Settings Modal */}
          <Modal
            isOpen={isSettingsModalOpen}
            onClose={handleCloseSettingsModal}
            title="User Settings"
          >
            <UserSettings
              initialSshKeyPath={userSettingsData?.sshPrivateKeyPath ?? ''}
              initialHasPassphrase={userSettingsData?.sshKeyHasPassphrase ?? false}
              // Pass down initial custom settings
              initialSshCustomHostname={userSettingsData?.sshCustomHostname}
              initialSshCustomPort={userSettingsData?.sshCustomPort}
              initialSshCustomUsername={userSettingsData?.sshCustomUsername}
              onSave={handleSaveSettings}
              onClose={handleCloseSettingsModal} // Pass close handler
            />
          </Modal>

        </Box>
    </>
  );
}

export default App;
