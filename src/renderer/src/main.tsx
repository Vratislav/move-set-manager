import "@radix-ui/themes/styles.css";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Theme } from '@radix-ui/themes'
import TrpcQueryProvider from './TrpcQueryProvider'   

createRoot(document.getElementById('root')!).render(



  <StrictMode>
    <Theme accentColor="grass" radius="large" appearance="dark">
      <TrpcQueryProvider>
        <App />
      </TrpcQueryProvider>
      {/* <ThemePanel /> */}
    </Theme>
  </StrictMode>

)
