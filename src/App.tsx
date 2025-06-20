import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ButtonExample from './components/ui/ButtonExample'
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
      
      <div>
        {/* Added rel="noreferrer" for security best practices with external links */}
        <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
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
      
      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          aria-label="Increment count"
        >
          count is {count}
        </button>
        <p>
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
