import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import UploadVideo from "./pages/UploadVideo";
import VideoList from "./pages/VideoList";
import VideoPlayer from "./pages/Videoplayer";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/VideoList" />} />
        <Route path="/uploadVideo" element={<UploadVideo />} />
        <Route path="/videoList" element={<VideoList />} />
        <Route path="/video/:id" element={<VideoPlayer />} />
      </Routes>
    </>
  );
}

export default App;
