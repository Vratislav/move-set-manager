import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { ipcLink } from 'electron-trpc/renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { trpcReact } from './trpc';

function UserList(): React.JSX.Element {
  const { data, isLoading } = trpcReact.userList.useQuery()

  if (isLoading) return <div>Loading...</div>
  if (!data) return <div>No data</div>
  return <div>{data.map((user) => <div key={user}>{user}</div>)}</div>
}

function Ping(): React.JSX.Element {
  
  const ping = trpcReact.ping.useMutation({
    onSuccess: (data) => {
      console.log(data)
    }
  })

  function handlePing(): void {
    ping.mutate()
  }
  return (
    <div className="action">
    <a target="_blank" rel="noreferrer" onClick={handlePing}>
      Send Ping
    </a>
  </div>
  )
}


function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [ipcLink()],
    })
  );


  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
        <Ping />
        <UserList />
      </div>
      <Versions></Versions>
    </>
    </QueryClientProvider>
    </trpcReact.Provider>
  )
}

export default App
