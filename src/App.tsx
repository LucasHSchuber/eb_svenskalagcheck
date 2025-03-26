import { HashRouter, Routes, Route } from "react-router-dom";
import './assets/css/main.css'
import './assets/css/buttons.css'
import './assets/css/components.css'

import Index from "./pages/index"

function App() {

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    </HashRouter>
  )
}

export default App
