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
import {
    useGetUserSettings,
    useUpdateUserSettings,
    useGetAllPages,
    useGetAllSets,
    useDownloadAllSets,
    useUploadPage
} from './queriesAndMutations';
import type { UserSettings as UserSettingsType } from '../../main/moveManagerLib/model/userSettings'; // Import the type
import type { MoveSet } from '../../main/moveManagerLib/model/set'; // Import MoveSet type
import { SyncingIndicator } from './components/SyncingIndicator'; // Import the new component
import { ErrorDisplay } from './components/ErrorDisplay'; // Import ErrorDisplay
import { COLORS, getColorForColorIndex, getColorStringForColorIndex } from './utils/setColors'; // Import color utility and new helper

// --- Mock Data --- //
// const mockPages = ['Page 1', 'Page 2', 'Empty Page']; // Removed mock pages

// Generate a larger pool of potential sets
const allPossibleSets: ReactSetData[] = Array.from({ length: 50 }, (_, i) => {
  const colorIndex = i % COLORS.length; // Use actual color index
  // const colorInfo = getColorForColorIndex(colorIndex); // No longer needed here
  return {
    id: `Set-${i + 1}`,
    name: `Awesome Set ${i + 1}`,
    revision: `rev${Math.floor(Math.random() * 10)}`,
    colorIndex: colorIndex, // Assign colorIndex
    // color: `var(--${colorInfo.name}-${colorInfo.grade})`, // Removed color property
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

// Grid dimensions
const GRID_ROWS = 4;
const GRID_COLS = 8;
const GRID_SIZE = GRID_ROWS * GRID_COLS;

// Function to map between logical index (0=bottom-left) and visual index (0=top-left)
// For an 8x4 grid, this transformation is its own inverse.
const mapGridIndex = (index: number): number => {
    if (index < 0 || index >= GRID_SIZE) return -1; // Invalid index
    const logicalRow = Math.floor(index / GRID_COLS);
    const logicalCol = index % GRID_COLS;
    const visualRow = (GRID_ROWS - 1) - logicalRow;
    const visualCol = logicalCol;
    return visualRow * GRID_COLS + visualCol;
};

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
  const { data: dataSets, isLoading: isLoadingSets, error: errorSets } = useGetAllSets(); // Fetch sets
  const { data: userSettingsData } = useGetUserSettings();
  const updateUserSettingsMutation = useUpdateUserSettings();
  const downloadAllSetsMutation = useDownloadAllSets();
  const uploadPageMutation = useUploadPage();
  // --- State --- //
  // Derive pages from fetched data, providing an empty array as a fallback
  const pages = useMemo(() => dataPages?.map(p => p.name) ?? [], [dataPages]);

  // Map fetched sets (MoveSet[]) to the ReactSetData format
  const allSetsReactData: ReactSetData[] = useMemo(() => {
    if (!dataSets) return [];
    return dataSets.map((set) => {
        // const colorInfo = getColorForColorIndex(set.meta.color); // No longer needed here
        return {
            id: set.meta.id,
            name: set.meta.name,
            revision: '(rev?)', // Assuming revision still needs to be determined or is static for now
            colorIndex: set.meta.color, // Use set.meta.color as the colorIndex
            // color: `var(--${colorInfo.name}-${colorInfo.grade})`, // Removed color property
            alias: undefined, // Assuming alias is not yet available or handled elsewhere
        };
    });
  }, [dataSets]);

  // Select the first page from the fetched data, or empty string if none exist or still loading
  const [selectedPage, setSelectedPage] = useState<string>('');

  // Update selected page when pages load
  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
        setSelectedPage(pages[0]);
    }
  }, [pages, selectedPage]);

  // State for the sets currently displayed on the grid for the selected page (using logical index: 0 = bottom-left)
  const [currentPageSets, setCurrentPageSets] = useState<(ReactSetData | null)[]>(Array(GRID_SIZE).fill(null));

  const [selectedSet, setSelectedSet] = useState<ReactSetData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarMode, setSidebarMode] = useState<'edit' | 'assign' | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null); // State for sync error message

  // Effect to update the grid sets when the selected page or the fetched data changes
  useEffect(() => {
    if (selectedPage && dataPages && allSetsReactData.length > 0) {
      const currentPageData = dataPages.find(p => p.name === selectedPage);
      if (currentPageData) {
        const setMap = new Map(allSetsReactData.map(s => [s.id, s]));
        
        // Initialize an empty grid (logical indices)
        const newGridSets = Array(GRID_SIZE).fill(null);

        // Place sets into the logical grid based on their index in page data
        currentPageData.sets.forEach(setInfo => {
            // Assuming setInfo.index is the logical index (0=bottom-left)
            if (setInfo?.id && setInfo.index >= 0 && setInfo.index < GRID_SIZE) {
                const setDetails = setMap.get(setInfo.id);
                if (setDetails) {
                    newGridSets[setInfo.index] = setDetails; // Use logical index
                }
            }
        });

        setCurrentPageSets(newGridSets);
        console.log(`Updated grid for page: ${selectedPage} using logical indices`);
      } else {
        // Page data not found, clear the grid
        setCurrentPageSets(Array(GRID_SIZE).fill(null));
      }
      setSelectedSet(null);
      setIsSidebarOpen(false);
      setSidebarMode(null);
      setSelectedSlotIndex(null);
    } else if (!isLoadingPages && !isLoadingSets) {
        setCurrentPageSets(Array(GRID_SIZE).fill(null));
    }
  }, [selectedPage, dataPages, allSetsReactData, isLoadingPages, isLoadingSets]);

  // Effect to show error modal for sync operations
  useEffect(() => {
    if (downloadAllSetsMutation.isError && downloadAllSetsMutation.error) {
      setSyncError(downloadAllSetsMutation.error.message || 'An unknown error occurred during download sync.');
      downloadAllSetsMutation.reset(); // Reset mutation state after handling error
    } else if (uploadPageMutation.isError && uploadPageMutation.error) {
      setSyncError(uploadPageMutation.error.message || 'An unknown error occurred during upload sync.');
      uploadPageMutation.reset(); // Reset mutation state after handling error
    }
  }, [
    downloadAllSetsMutation.isError, downloadAllSetsMutation.error, downloadAllSetsMutation,
    uploadPageMutation.isError, uploadPageMutation.error, uploadPageMutation
  ]);

  const handleSelectPage = (page: string) => {
    setSelectedPage(page);
    //setCurrentPageSets(generateMockSets(page));
    setSelectedSet(null);
    setIsSidebarOpen(false);
    setSidebarMode(null);
    setSelectedSlotIndex(null);
    console.log(`Selected page: ${page}`);
  };

  const handleSlotClick = (abletonMoveIndex: number, set: ReactSetData | null) => {
    const logicalIndex = mapGridIndex(abletonMoveIndex); // Convert visual index from grid to logical index
    if (logicalIndex === -1) return; // Ignore invalid index

    if (set) {
        // Clicked on a slot with a set -> Edit mode
        setSelectedSet(set);
        setSidebarMode('edit');
        setSelectedSlotIndex(null); // Not needed for edit mode
        console.log(`Selected set for editing: ${set.name} at grid index ${logicalIndex} (AbletonMoveIndex: ${abletonMoveIndex})`);
    } else {
        // Clicked on an empty slot -> Assign mode
        setSelectedSet(null); // No specific set selected
        setSidebarMode('assign');
        setSelectedSlotIndex(logicalIndex); // Remember which logical slot to assign to
        console.log(`Selected empty slot for assignment at grid index ${logicalIndex} (AbletonMoveIndex: ${abletonMoveIndex})`);
    }
    setIsSidebarOpen(true);
  };

  const handleDeleteSet = (setId: string) => {
    setCurrentPageSets((prevSets) => prevSets.map(s => (s?.id === setId ? null : s)));
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
  };

  // Mock handlers for TopBar actions
  const handleDuplicatePage = () => console.log('Duplicate page clicked');
  const handleDownloadPage = () => {
    console.log('Update page from move clicked')
    setSyncError(null); // Clear previous errors
    downloadAllSetsMutation.mutate()
  }
  const handleUploadPage = () => {
    console.log('Upload page to move clicked for page:', selectedPage);
    if (!selectedPage) {
      setSyncError("No page selected to upload.");
      return;
    }
    // Find the selected page details from dataPages to get its ID
    const pageToUpload = dataPages?.find(p => p.name === selectedPage);
    if (!pageToUpload) {
        setSyncError(`Could not find details for page: ${selectedPage}`);
        return;
    }
    setSyncError(null); // Clear previous errors
    uploadPageMutation.mutate(pageToUpload.id);
  };
  const handleUpdateSet = (id: string, updatedSet: Partial<ReactSetData>) => {
    console.log('Update set (from sidebar - placeholder):', updatedSet);
    //For example:
    setCurrentPageSets(prevSets => prevSets.map(s => {
      if (s && s.id === id) {
        const newSetData = { ...s, ...updatedSet };
        return newSetData;
      }
      return s;
    }));
    setIsSidebarOpen(false);
  };

  // Handler for assigning a set from the AssignSetToGridForm
  const handleAssignSet = (setId: string) => {
    if (selectedSlotIndex === null) return;

    const set_to_assign = allSetsReactData.find(s => s.id === setId);
    if (!set_to_assign) {
        console.error(`Set with ID ${setId} not found in fetched sets.`);
        return;
    }

    console.log(`Assigning set ${setId} (${set_to_assign.name}) to slot index ${selectedSlotIndex}`);

    setCurrentPageSets(prevSets => {
      const newSets = [...prevSets];
      if (newSets.some(s => s?.id === setId)) {
         console.warn(`Set ${setId} is already on this page.`);
         return prevSets;
      }
      newSets[selectedSlotIndex] = set_to_assign;
      return newSets;
    });

    handleCloseSidebar();
  };

  // Determine available sets (those in allSetsReactData but not in currentPageSets)
  const availableSetsForAssignment = useMemo(() => {
    const currentSetIds = new Set(currentPageSets.filter(s => s !== null).map(s => s!.id));
    return allSetsReactData.filter(s => !currentSetIds.has(s.id));
  }, [currentPageSets, allSetsReactData]);

  // Determine which grid index should be highlighted (visual index for the MoveGrid component)
  const displayHighlightedIndex = useMemo(() => {
    let logicalHighlightIndex: number | null = null;
    if (sidebarMode === 'edit' && selectedSet) {
      // Find the logical index of the selected set in the current page grid
      logicalHighlightIndex = currentPageSets.findIndex(s => s?.id === selectedSet.id);
    } else if (sidebarMode === 'assign') {
      logicalHighlightIndex = selectedSlotIndex; // This is already the logical index
    }

    if (logicalHighlightIndex !== null && logicalHighlightIndex !== -1) {
        return mapGridIndex(logicalHighlightIndex); // Convert logical index to visual index for highlighting
    }
    return null; // No highlight
  }, [sidebarMode, selectedSet, selectedSlotIndex, currentPageSets]);

  // Transform the logical currentPageSets into the display order needed by MoveGrid (visual index)
  const displayGridSets = useMemo(() => {
    const transformedSets = Array(GRID_SIZE).fill(null);
    for (let logicalIndex = 0; logicalIndex < GRID_SIZE; logicalIndex++) {
        const visualIndex = mapGridIndex(logicalIndex);
        if (visualIndex !== -1) {
            transformedSets[visualIndex] = currentPageSets[logicalIndex];
        }
    }
    return transformedSets;
  }, [currentPageSets]);

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

    const settingsToSave: UserSettingsType = { 
      sshPrivateKeyPath: settings.sshKeyPath,
      sshKeyHasPassphrase: settings.hasPassphrase,
      sshCustomHostname: settings.sshCustomHostname,
      sshCustomPort: settings.sshCustomPort,
      sshCustomUsername: settings.sshCustomUsername,
      onboardingCompleted: userSettingsData?.onboardingCompleted ?? true,
    };

    updateUserSettingsMutation.mutate(settingsToSave);

    handleCloseSettingsModal();
  };

  const isSyncing = downloadAllSetsMutation.isPending || uploadPageMutation.isPending;

  return (
    <>
        <Box style={{ position: 'relative', minHeight: '100vh' }}>
          <Flex
            gap="2"
            align="center"
            style={{ position: 'absolute', top: 'var(--space-5)', right: 'var(--space-4)', zIndex: 10 }}
          >
            {userSettingsData && !userSettingsData.sshPrivateKeyPath && (
              <Badge color="yellow" variant="soft" size="2">
                <Flex gap="1" align="center">
                  <ExclamationTriangleIcon width="14" height="14" />
                  <Text size="2">No SSH Key path set! Set it here →</Text>
                </Flex>
              </Badge>
            )}
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
              pages={pages}
              selectedPage={selectedPage}
              onSelectPage={handleSelectPage}
              onDuplicatePage={handleDuplicatePage}
              onUpdatePage={handleDownloadPage}
              onUploadPage={handleUploadPage}
            />
            <MoveGrid
              sets={displayGridSets} // Pass the move index ordered sets
              onSlotClick={handleSlotClick}
              onDeleteSet={handleDeleteSet}
              highlightedIndex={displayHighlightedIndex} // Pass the move index correct highlight index
            />
          </Flex>

          <Sidebar
            title={sidebarMode === 'edit' ? 'Set Details' : sidebarMode === 'assign' ? 'Assign Set to Slot' : ''}
            idLabel={sidebarMode === 'edit' && selectedSet ? `id: ${selectedSet.id}` : undefined}
            isOpen={isSidebarOpen}
            onClose={handleCloseSidebar}
          >
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

          <Modal
            isOpen={isSettingsModalOpen}
            onClose={handleCloseSettingsModal}
            title="User Settings"
          >
            <UserSettings
              initialSshKeyPath={userSettingsData?.sshPrivateKeyPath ?? ''}
              initialHasPassphrase={userSettingsData?.sshKeyHasPassphrase ?? false}
              initialSshCustomHostname={userSettingsData?.sshCustomHostname}
              initialSshCustomPort={userSettingsData?.sshCustomPort}
              initialSshCustomUsername={userSettingsData?.sshCustomUsername}
              onSave={handleSaveSettings}
              onClose={handleCloseSettingsModal}
            />
          </Modal>

          <Modal
            isOpen={isSyncing} // Use the combined isSyncing state
            onClose={() => {}} // No-op as it cannot be closed by user
            title="Syncing"
            hideCloseButton={true}
          >
            <SyncingIndicator />
          </Modal>

          {/* Error Modal for Syncing */}
          <Modal
            isOpen={!!syncError} 
            onClose={() => setSyncError(null)} // Clear error on close
            title="Sync Error"
          >
            {syncError && <ErrorDisplay errorMessage={syncError} onDismiss={() => setSyncError(null)} />}
          </Modal>

        </Box>
    </>
  );
}

export default App;
