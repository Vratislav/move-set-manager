import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpcReact } from "./trpc";
import { ipcLink } from "electron-trpc/renderer";
import { useState } from "react";


function TrpcQueryProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
      trpcReact.createClient({
        links: [ipcLink()],
      }),
    );
    return (
        <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </trpcReact.Provider>
    )
}

export default TrpcQueryProvider;