import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import BossGame from './components/BossGameComponent.tsx'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
      
      <BossGame />
    </>
  )
}

export default App
