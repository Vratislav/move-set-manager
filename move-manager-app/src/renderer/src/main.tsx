import "@radix-ui/themes/styles.css";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Theme, ThemePanel } from '@radix-ui/themes'


createRoot(document.getElementById('root')!).render(



  <StrictMode>
    <Theme accentColor="grass" radius="large" appearance="dark">
      <App />
      {/* <ThemePanel /> */}
    </Theme>
  </StrictMode>

)
