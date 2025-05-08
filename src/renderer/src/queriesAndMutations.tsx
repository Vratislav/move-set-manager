import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { trpcClient } from "./trpc"
import { MovePage } from "../../main/moveManagerLib/model/page"
import { UserSettings } from "../../main/moveManagerLib/model/userSettings"
import { MoveSetInPage } from "../../main/moveManagerLib/model/set"

const key = {
    allDevices: ['devices'] as const,
    allSets: ['sets'] as const,
    allPages: ['pages'] as const,
    page: (pageId: string) => [...key.allPages, 'detail', pageId] as const,
    userSettings: ['userSettings'] as const,
}


export function useGetAllDevices(){
   return useQuery({queryKey: key.allDevices, queryFn: async () => {
        console.log('Fetching devices')
        const devices = await trpcClient.getAllDevices.query()
        return devices
      }})
}

export function useGetAllSets(){
    return useQuery({queryKey: key.allSets, queryFn: async () => {
        console.log('Fetching sets')
        const sets = await trpcClient.getAllSets.query()
        return sets
    }})
}

export function useGetAllPages(){
    return useQuery({queryKey: key.allPages, queryFn: async () => {
        console.log('Fetching pages')
        const pages = await trpcClient.getAllPages.query()
        return pages
    }})
}


export function useGetPage(pageId: string){
    return useQuery({queryKey: key.page(pageId), queryFn: async () => {
        console.log(`Fetching page ${pageId}`)
        const page = await trpcClient.getPage.query({ pageId })
        return page
    }})
}

export function useCreatePage(){
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (variables: { page: MovePage, deviceId?: string }) => {
            console.log('Creating page', variables.page)
            return await trpcClient.createPage.mutate(variables)
        },
        onSuccess: () => {
            // Invalidate and refetch pages query after successful creation
            queryClient.invalidateQueries({ queryKey: key.allPages })
        },
    })
}


export function useGetUserSettings(){
    return useQuery({queryKey: key.userSettings, queryFn: async () => {
        console.log('Fetching user settings')
        const settings = await trpcClient.getUserSettings.query()
        return settings
    }})
}

export function useUpdateUserSettings() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (userSettings: UserSettings) => {
            console.log('Updating user settings', userSettings)
            return await trpcClient.updateUserSettings.mutate({ userSettings: userSettings })
        },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(key.userSettings, variables)
        },
    })
}

export function useDownloadAllSets() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async () => {
            console.log('Downloading all sets')
            return await trpcClient.downloadAllSets.mutate()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: key.allSets })
            queryClient.invalidateQueries({ queryKey: key.allPages })
        },
    })
}

export function useUploadPage() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (pageId: string) => {
            console.log('Uploading page', pageId)
            return await trpcClient.uploadPage.mutate({ pageId })
        }
    })
}

export function useUpdateSetInPage() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (variables: { page: MovePage, set: MoveSetInPage, setName: string }) => {
            return await trpcClient.updateSetInPage.mutate({ page: variables.page, moveSetInPage: {
                id: variables.set.id,
                color: variables.set.color,
                index: variables.set.index,
                alias: variables.set.alias
            }, setName: variables.setName })   
        },onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: key.allSets })
            queryClient.invalidateQueries({ queryKey: key.allPages })
        },
    })
}

export function usePing() {
    return useMutation({
        mutationFn: async () => {
            console.log('Pinging server')
            return await trpcClient.ping.mutate()
        }
    })
}

export function useOpenSSHKeyFileSelectionDialog() {
    return useMutation({
        mutationFn: async () => {
            console.log('Opening SSH key file selection dialog')
            return await trpcClient.openSSHKeyFileSelectionDialog.mutate()
        }
    })
}




