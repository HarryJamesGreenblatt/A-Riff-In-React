import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ButtonExample, { Button } from './components/ui/ButtonExample'
import UserExample from './components/ui/UserExample'
import { LoginButton } from './components/auth/LoginButton'
import { AuthGuard } from './components/auth/AuthGuard'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* Authentication UI */}
      <div className="absolute top-4 right-4">
        <LoginButton />
      </div>
      
      <div className="flex flex-row items-center justify-center gap-8 mb-4">
        <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="h-24 transition duration-300" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="h-24 drop-shadow-[0_0_2em_#61dafb] animate-spin-slow" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      
      {/* Example usage of shadcn/ui Button and Tailwind button */}
      <ButtonExample />
      
      {/* Protected content with AuthGuard */}
      <AuthGuard>
        {/* Redux state management example */}
        <UserExample />
      </AuthGuard>
      
      <div className="p-8 rounded-lg shadow bg-white dark:bg-gray-900 mb-4">
        <ButtonExample />
        <div className="mt-4">
          <Button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </Button>
        </div>
        <p className="mt-2 text-gray-500">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
