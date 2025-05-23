import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useEffect } from 'react';
import { trpcClient } from './trpc';
import { Flex, Box, IconButton, Text, Badge, Button } from '@radix-ui/themes';
import { GearIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { TopBar } from './components/TopBar';
import { MoveGrid } from './components/MoveGrid';
import { Sidebar } from './components/Sidebar';
import { EditSetForm } from './components/EditSetForm';
import { AssignSetToGridForm } from './components/AssignSetToGridForm';
import { Modal } from './components/Modal';
import { UserSettings } from './components/UserSettings';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DisclaimerModal } from './components/DisclaimerModal';
import { ReactSetData } from './components/MoveGridSet';
import { VersionInfo } from './components/SidebarComponents';
import './App.css'; // Import global styles
import {
    useGetUserSettings,
    useUpdateUserSettings,
    useGetAllPages,
    useGetAllSets,
    useDownloadAllSets,
    useUploadPage,
    useUpdateSetInPage,
    useUpdatePage,
    useDeletePage,
    useOpenDownloadAllAblBundlesDirectorySelectionDialog,
    useStartRestApiChallenge,
    useSubmitRestApiChallengeResponse,
    useDownloadAllAblBundles,
} from './queriesAndMutations';
import type { UserSettings as UserSettingsType } from '../../main/moveManagerLib/model/userSettings'; // Import the type
import type { MoveSetInPage } from '../../main/moveManagerLib/model/set'; // Import MoveSet type
import type { MovePage } from '../../main/moveManagerLib/model/page'; // Import MovePage type
import { SyncingIndicator } from './components/SyncingIndicator'; // Import the new component
import { ErrorDisplay } from './components/ErrorDisplay'; // Import ErrorDisplay
import { ChallengeSecretModal } from './components/ChallengeSecretModal'; // Import ChallengeSecretModal



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


  const { data: dataPages, isLoading: isLoadingPages } = useGetAllPages(); // Fetch pages
  const { data: dataSets, isLoading: isLoadingSets } = useGetAllSets(); // Fetch sets
  const { data: userSettingsData, isFetched: isFetchedUserSettings } = useGetUserSettings();
  const updateUserSettingsMutation = useUpdateUserSettings();
  const downloadAllSetsMutation = useDownloadAllSets();
  const uploadPageMutation = useUploadPage();
  const updateSetMutation = useUpdateSetInPage();
  const updatePageMutation = useUpdatePage();
  const deletePageMutation = useDeletePage();

  // Mutations for Download All ABL Bundles flow
  const openDirDialogMutation = useOpenDownloadAllAblBundlesDirectorySelectionDialog();
  const startChallengeMutation = useStartRestApiChallenge();
  const submitChallengeMutation = useSubmitRestApiChallengeResponse();
  const downloadAllAblBundlesMutation = useDownloadAllAblBundles();

  // --- State --- //
  // Derive pages from fetched data, providing an empty array as a fallback
  const pagesObjects = useMemo(() => dataPages?.map(p => ({ id: p.id, name: p.name })) ?? [], [dataPages]);
  // Select the first page from the fetched data, or empty string if none exist or still loading
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const allSetsMap = useMemo(() => new Map(dataSets?.map(s => [s.meta.id, s])), [dataSets]);
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

  const setsOnPageReactData: ReactSetData[] = useMemo(() => {
    if (!dataPages) return [];
    if (selectedPageId === null) return [];
    const currentPage = dataPages.find(p => p.id === selectedPageId);
    if (!currentPage) return [];
    if(!allSetsMap || allSetsMap.size === 0) return [];
    return currentPage.sets.map(s => {
      const origSetData = allSetsMap.get(s.id);
      const setData: ReactSetData = {
        id: s.id,
        colorIndex: s.color || origSetData!.meta.color,
        name: origSetData!.meta.name,
        revision: '(rev?)',
        alias: s.alias
      }
      return setData;
    });
  }, [dataPages, allSetsMap, selectedPageId]);



  // Update selected page when pages load
  useEffect(() => {
    if (pagesObjects.length > 0 && !selectedPageId) {
        setSelectedPageId(pagesObjects[0].id);
    }
  }, [pagesObjects, selectedPageId]);

  // State for the sets currently displayed on the grid for the selected page (using logical index: 0 = bottom-left)
  const [currentPageSets, setCurrentPageSets] = useState<(ReactSetData | null)[]>(Array(GRID_SIZE).fill(null));

  const [selectedSet, setSelectedSet] = useState<ReactSetData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarMode, setSidebarMode] = useState<'edit' | 'assign' | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null); // State for sync error message
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState<boolean>(false); // State for delete confirmation modal
  const [pageToDeleteId, setPageToDeleteId] = useState<string | null>(null); // State for page to delete ID

  // State for Download All ABL Bundles flow
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState<boolean>(false);
  const [selectedDownloadDir, setSelectedDownloadDir] = useState<string | null>(null);
  const [ablDownloadError, setAblDownloadError] = useState<string | null>(null); // Specific error state for this flow
  const [syncingModalMessage, setSyncingModalMessage] = useState<string>("Syncing..."); // Message for the generic syncing modal
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null); // For ABL bundle download success

  // Effect to update the grid sets when the selected page or the fetched data changes
  useEffect(() => {
    if (selectedPageId && dataPages && allSetsReactData.length > 0) {
      const currentPageData = dataPages.find(p => p.id === selectedPageId);
      if (currentPageData) {
        const setMap = new Map(setsOnPageReactData.map(s => [s.id, s]));
        
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
        console.log(`Updated grid for page ID: ${selectedPageId} using logical indices`);
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
  }, [selectedPageId, dataPages, isLoadingPages, isLoadingSets, setsOnPageReactData]);

  // Effect to show error modal for sync operations
  useEffect(() => {
    if (downloadAllSetsMutation.isError && downloadAllSetsMutation.error) {
      setSyncError(downloadAllSetsMutation.error.message || 'An unknown error occurred during download sync.');
      downloadAllSetsMutation.reset(); // Reset mutation state after handling error
      setSyncingModalMessage("Syncing..."); // Reset message
    } else if (uploadPageMutation.isError && uploadPageMutation.error) {
      setSyncError(uploadPageMutation.error.message || 'An unknown error occurred during upload sync.');
      uploadPageMutation.reset(); // Reset mutation state after handling error
      setSyncingModalMessage("Syncing..."); // Reset message
    }
  }, [
    downloadAllSetsMutation.isError, downloadAllSetsMutation.error, downloadAllSetsMutation,
    uploadPageMutation.isError, uploadPageMutation.error, uploadPageMutation
  ]);

  // Effect to handle errors from ABL download mutations
  useEffect(() => {
    if (openDirDialogMutation.isError) {
      setAblDownloadError(openDirDialogMutation.error?.message || 'Failed to open directory selection dialog.');
      openDirDialogMutation.reset();
    } else if (startChallengeMutation.isError) {
      setAblDownloadError(startChallengeMutation.error?.message || 'Failed to start REST API challenge.');
      startChallengeMutation.reset();
    } else if (submitChallengeMutation.isError) {
      setAblDownloadError(submitChallengeMutation.error?.message || 'Failed to submit challenge response.');
      submitChallengeMutation.reset();
    } else if (downloadAllAblBundlesMutation.isError) {
      setAblDownloadError(downloadAllAblBundlesMutation.error?.message || 'Failed to download ABL bundles.');
      downloadAllAblBundlesMutation.reset();
      setSyncingModalMessage("Syncing..."); // Reset message on error
    }
  }, [
    openDirDialogMutation.isError, openDirDialogMutation.error, openDirDialogMutation,
    startChallengeMutation.isError, startChallengeMutation.error, startChallengeMutation,
    submitChallengeMutation.isError, submitChallengeMutation.error, submitChallengeMutation,
    downloadAllAblBundlesMutation.isError, downloadAllAblBundlesMutation.error, downloadAllAblBundlesMutation
  ]);

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedSet(null);
    setIsSidebarOpen(false);
    setSidebarMode(null);
    setSelectedSlotIndex(null);
    console.log(`Selected page ID: ${pageId}`);
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
    const currentPage = dataPages!.find(p => p.id === selectedPageId)!;
    //filter out sets so it does not include the set with the id setId
    currentPage.sets = currentPage.sets.filter(s => s.id !== setId);
    //Log out set that is being deleted
    console.log('Deleting set:', setId, 'in page:', currentPage.id);
    updatePageMutation.mutate({ page: currentPage });
    
    console.log(`Deleted set: ${setId}`);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSidebarMode(null);
    setSelectedSlotIndex(null);
  };

  // --- Page Deletion Handlers --- //
  const handleRequestDeletePage = () => {
    if (selectedPageId) {
      setPageToDeleteId(selectedPageId);
      setIsDeleteConfirmModalOpen(true);
      console.log(`Requesting delete for page ID: ${selectedPageId}`);
    }
  };

  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setPageToDeleteId(null);
  };

  const handleConfirmDeletePage = () => {
    if (pageToDeleteId) {
      deletePageMutation.mutate(pageToDeleteId, {
        onSuccess: () => {
          console.log(`Page ${pageToDeleteId} deleted successfully.`);
          if (selectedPageId === pageToDeleteId) {
            const remainingPages = dataPages?.filter(p => p.id !== pageToDeleteId) ?? [];
            if (remainingPages.length > 0) {
              setSelectedPageId(remainingPages[0].id);
            } else {
              setSelectedPageId(null);
            }
          }
          setPageToDeleteId(null); // Clear the page to delete ID
          // The modal will be closed by its own logic if onConfirm also calls onClose
        },
        onError: (error) => {
          setSyncError(error.message || 'Failed to delete page.');
          setPageToDeleteId(null); // Clear the page to delete ID
        }
      });
    }
    setIsDeleteConfirmModalOpen(false); // Ensure modal closes
  };
  // ------------------------------- //

  const handleCreateNewPage = () => {
    let newPageName = 'New Page';

    const newPageData: MovePage = {
      id: `page-${Date.now()}`,
      name: newPageName,
      sets: [],
    };

    console.log('Attempting to create new page with data:', newPageData);
    updatePageMutation.mutate({ page: newPageData }, {
      onSuccess: () => {
        setSelectedPageId(newPageData.id);
      },
      onError: (error) => {
        setSyncError(error.message || 'Failed to create page.');
      }
    });
  };

  const handleDuplicatePageRequest = () => {
    if (updatePageMutation.isPending) {
      console.warn('Duplicate page request is already in progress.');
      return;
    }

    if (!selectedPageId || !dataPages) {
      console.warn('No page selected or pages data not available for duplication.');
      setSyncError('No page selected to duplicate.');
      return;
    }

    const currentPageData = dataPages.find(p => p.id === selectedPageId);
    if (!currentPageData) {
      console.error(`Page with ID ${selectedPageId} not found for duplication.`);
      setSyncError('Selected page data not found.');
      return;
    }

    const newPageData: MovePage = {
      id: `page-${Date.now()}`, // Placeholder ID, backend should generate the real one.
      name: `${currentPageData.name} (copy)`,
      sets: currentPageData.sets.map(s => ({ ...s })) // Shallow copy of sets array and its objects
    };

    console.log('Attempting to duplicate page:', currentPageData.name, 'as:', newPageData.name);
    updatePageMutation.mutate({ page: newPageData }, {
      onSuccess: (createdPage) => { // Assuming backend returns the created page
        console.log('Page duplicated successfully', createdPage);
        // Optionally, select the new page - would need its ID from backend response.
        // queryClient.invalidateQueries({ queryKey: key.allPages }) is handled by useCreatePage hook
      },
      onError: (error) => {
        console.error('Error duplicating page:', error);
        setSyncError(error.message || 'Failed to duplicate page.');
      }
    });
  };

  // Mock handlers for TopBar actions
  const handleDownloadPage = () => {
    console.log('Update page from move clicked')
    setSyncError(null); // Clear previous errors
    setSyncingModalMessage("Syncing page data...");
    downloadAllSetsMutation.mutate()
  }
  const handleUploadPage = () => {
    console.log('Upload page to move clicked for page ID:', selectedPageId);
    if (!selectedPageId) {
      setSyncError("No page selected to upload.");
      return;
    }
    // The pageId is already selectedPageId
    setSyncError(null); // Clear previous errors
    setSyncingModalMessage("Syncing page data...");
    uploadPageMutation.mutate(selectedPageId);
  };
  const handleUpdateSet = (id: string, updatedSet: Partial<ReactSetData>) => {
    console.log('Update set (from sidebar - placeholder):', updatedSet);
    
    //For example:
    setCurrentPageSets(prevSets => prevSets.map(s => {
      if (s && s.id === id) {
        const newSetData = { ...s, ...updatedSet };
        updatedSet = newSetData;
        return newSetData;
      }
      return s;
    }));
    const currentPage = dataPages!.find(p => p.id === selectedPageId)!;
    const originalSet = allSetsReactData.find(s => s.id === id)!;
    const currentSetInPage = currentPage.sets.find(s => s.id === id)!;
    const setUpdate: MoveSetInPage = {
      id: id,
      color: updatedSet.colorIndex || currentSetInPage.color,
      index: currentSetInPage.index,
      alias: updatedSet.alias || currentSetInPage.alias
    }

    updateSetMutation.mutate({
      page: currentPage,
      set: setUpdate,
      setName: updatedSet.name || originalSet.name
    })

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

    const currentPage = dataPages!.find(p => p.id === selectedPageId)!; 
    const setToAssignRawData = allSetsMap.get(setId)!;
    currentPage.sets.push({
      id: setId,
      color: setToAssignRawData.meta.color,
      index: selectedSlotIndex,
      alias: undefined
    })
    updatePageMutation.mutate({ page: currentPage });

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

  const handleUpdatePageName = (newPageName: string) => {
    if (!selectedPageId || !dataPages) return;

    const pageToUpdate = dataPages.find(p => p.id === selectedPageId);
    if (pageToUpdate) {
      const updatedPage = { ...pageToUpdate, name: newPageName };
      updatePageMutation.mutate({ page: updatedPage });
      console.log(`Updating page name for ID: ${selectedPageId} to "${newPageName}"`);
    } else {
      console.error(`Page with ID ${selectedPageId} not found for renaming.`);
    }
  };

  const isSyncing = downloadAllSetsMutation.isPending || uploadPageMutation.isPending || downloadAllAblBundlesMutation.isPending || submitChallengeMutation.isPending;
  const isChallengeProcessActive = startChallengeMutation.isPending || submitChallengeMutation.isPending || downloadAllAblBundlesMutation.isPending;

  const selectedPageObject = useMemo(() => {
    if (!selectedPageId || !dataPages) return undefined;
    return dataPages.find(p => p.id === selectedPageId);
  }, [dataPages, selectedPageId]);

  const handleDisclaimerClose = () => {
    updateUserSettingsMutation.mutate({...userSettingsData!, onboardingCompleted: true});
    console.log('Disclaimer has been agreed to and closed.');
  };

  // --- Download All ABL Bundles Flow Handlers ---
  const handleStartDownloadAllAblBundles = async () => {
    setAblDownloadError(null);
    setSyncError(null);
    setSyncingModalMessage("Preparing download..."); // Initial message
    try {
      console.log('Starting Download All ABL Bundles flow...');
      const directoryPath = await openDirDialogMutation.mutateAsync();
      if (directoryPath) {
        console.log('Directory selected:', directoryPath);
        setSelectedDownloadDir(directoryPath);
        await startChallengeMutation.mutateAsync();
        console.log('REST API challenge started. Opening challenge modal.');
        setIsChallengeModalOpen(true);
      } else {
        console.log('Directory selection was cancelled or failed.');
      }
    } catch (error: any) {
      console.error('Error in Download All ABL Bundles flow (directory/start challenge):', error);
      setAblDownloadError(error.message || 'An unexpected error occurred.');
    }
  };

  const handleSubmitChallengeSecret = async (secret: string) => {
    setAblDownloadError(null);
    try {
      console.log('Submitting challenge secret...');
      setSyncingModalMessage("Verifying challenge...");
      await submitChallengeMutation.mutateAsync(secret);
      // If submitChallengeMutation is successful, the cookie is obtained by the client internally.
      // Now, attempt to download all ABL bundles.
      if (selectedDownloadDir) {
        console.log(`Challenge successful. Downloading all ABL bundles to: ${selectedDownloadDir}`);
        setSyncingModalMessage("Downloading .ablbundles. This may take a while...");
        await downloadAllAblBundlesMutation.mutateAsync(selectedDownloadDir, {
          onSuccess: () => {
            setDownloadSuccessMessage(`Bundles downloaded to: ${selectedDownloadDir}`);
            setSelectedDownloadDir(null); // Clear dir after successful download
            setSyncingModalMessage("Syncing..."); // Reset message
          },
          onError: () => { // onError is also handled by the useEffect, but good to reset message here too
            setSyncingModalMessage("Syncing...");
          }
        });
        console.log('Download all ABL bundles command issued successfully.');
        // Actual success/failure of download will be reflected in its own mutation state
        // and potentially an event/notification from the main process if it's a long operation.
        // For now, we assume the command to download has been sent.
      } else {
        throw new Error('Selected download directory is not set.');
      }
    } catch (error: any) {
      console.error('Error submitting challenge or starting download:', error);
      setAblDownloadError(error.message || 'Failed to process challenge or start download.');
    } finally {
      setIsChallengeModalOpen(false); // Close modal regardless of outcome, error is shown elsewhere
    }
  };

  const handleCloseChallengeModal = () => {
    setIsChallengeModalOpen(false);
    // Reset mutations that might be in an error state if modal is closed manually
    startChallengeMutation.reset();
    submitChallengeMutation.reset();
    // Do not reset downloadAllAblBundlesMutation as it might be in progress
    // or its error should persist until explicitly cleared.
    setSelectedDownloadDir(null); // Clear selected directory if flow is abandoned
    console.log('Challenge modal closed.');
  };

  return (
    <>
        <Box style={{ position: 'relative', minHeight: '100vh' }}>
          <Flex
            gap="2"
            align="center"
            style={{ position: 'absolute', top: 'var(--space-5)', right: 'var(--space-4)', zIndex: 10 }}
          >
            {((isFetchedUserSettings && !userSettingsData) || (userSettingsData && !userSettingsData.sshPrivateKeyPath)) && (
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

          <Flex direction="column" gap="6" p="4">
            <TopBar
              pages={pagesObjects}
              selectedPage={selectedPageId}
              onSelectPage={handleSelectPage}
              onDuplicatePage={handleDuplicatePageRequest}
              onUpdatePage={handleDownloadPage}
              onUploadPage={handleUploadPage}
              onPageNameEdited={handleUpdatePageName}
              currentPageName={selectedPageObject?.name}
              onDeletePage={handleRequestDeletePage}
              onCreateNewPage={handleCreateNewPage}
              areAnySetsAvailable={allSetsReactData.length > 0}
              onDownloadAllAblBundles={handleStartDownloadAllAblBundles} // Pass the new handler
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
            {sidebarMode === 'assign' && selectedSlotIndex !== null && (
              <AssignSetToGridForm
                key={`assign-form-${selectedSlotIndex}`}
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
            <SyncingIndicator message={syncingModalMessage} />
          </Modal>

          {/* Error Modal for Syncing */}
          <Modal
            isOpen={!!syncError} 
            onClose={() => setSyncError(null)} // Clear error on close
            title="Sync Error"
          >
            {syncError && <ErrorDisplay errorMessage={syncError} onDismiss={() => setSyncError(null)} />}
          </Modal>

          {/* Error Modal for ABL Download Flow */} 
          <Modal
            isOpen={!!ablDownloadError}
            onClose={() => setAblDownloadError(null)}
            title="Download Error"
          >
            {ablDownloadError && <ErrorDisplay errorMessage={ablDownloadError} onDismiss={() => setAblDownloadError(null)} />}
          </Modal>

          {/* Challenge Secret Modal */}
          <ChallengeSecretModal
            isOpen={isChallengeModalOpen}
            onClose={handleCloseChallengeModal} // Use a specific close handler for cleanup
            onSubmit={handleSubmitChallengeSecret}
            isLoading={isChallengeProcessActive}
          />

          {/* Download Success Modal */}
          {downloadSuccessMessage && (
            <Modal
              isOpen={!!downloadSuccessMessage}
              onClose={() => setDownloadSuccessMessage(null)}
              title="Download Complete"
            >
              <Text as="p" size="3" mb="4">{downloadSuccessMessage}</Text>
              <Flex justify="end" mt="4">
                <Button onClick={() => setDownloadSuccessMessage(null)}>OK</Button>
              </Flex>
            </Modal>
          )}

          {/* Confirmation Modal for Page Deletion */}
          <ConfirmationModal
            isOpen={isDeleteConfirmModalOpen}
            onClose={handleCloseDeleteConfirmModal}
            onConfirm={handleConfirmDeletePage}
            title="Delete Page"
            message={`Are you sure you want to delete page "${dataPages?.find(p => p.id === pageToDeleteId)?.name || ''}"? This action cannot be undone.`}
            confirmButtonText="Delete"
          />

          {/* Disclaimer Modal - shows if onboarding is not completed */}
          {isFetchedUserSettings && (
            <DisclaimerModal 
              isOpen={!userSettingsData?.onboardingCompleted}
              onClose={handleDisclaimerClose}
            />
          )}

        </Box>
        
        <Text size="1" style={{ position: 'fixed', bottom: 'var(--space-2)', left: 'var(--space-2)', color: 'var(--gray-a10)' }}>
          v{window.appVersion || 'loading...'}
        </Text>
    </>
  );
}

export default App;
