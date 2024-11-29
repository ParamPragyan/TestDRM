import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Routes, Route, Navigate } from "react-router-dom";
import UploadVideo from './pages/UploadVideo';
import VideoList from './pages/VideoList';
import VideoPlayer from './pages/Videoplayer';
// import Sidebar from './components/Sidebar'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/VideoList" />} />
        <Route path="/uploadVideo" element={<UploadVideo />} />
        <Route path="/videoList" element={<VideoList />} />
        {/* <Route path="/videoplayer" element={<VideoPlayer />}/> */}
        <Route path="/video/:videoId" element={<VideoPlayer />} />
      </Routes>
    </>
  );
}

export default App
