// import { useState } from 'react'
import { HashRouter, Routes, Route } from "react-router-dom";

// import './assets/css/global.css'
import './assets/css/main.css'
import './assets/css/buttons.css'
import './assets/css/components.css'

import Index from "./pages/index"
// import Categorymanagment from "./pages/categorymanagment"

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
