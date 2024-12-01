import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";

const VideoPlayer = () => {
  const { title } = useParams(); // Get video ID from URL
  const location = useLocation(); // Get the location object
  const selectedVideo = location.state?.selectedVideo; // Access the passed state
  const navigate = useNavigate();
  // If video data is not available, you can fetch it using the title or display an error
  if (!selectedVideo) {
    return <div>No video found for the title: {title}</div>;
  }
  const handleClick = (e) => {
    e.preventDefault();
    navigate("/videoList");
  };

  return (
    <div className="flex flex-col items-center p-6 bg-[#f0f0f0] min-h-screen">
      <button
        onClick={handleClick}
        className="absolute top-6 left-6 flex items-center px-4 py-2 bg-[#86a037] text-white rounded-full shadow-lg hover:bg-[#586a23] transition duration-300"
      >
        <BiArrowBack size={24} />
      </button>
      <h1 className="text-[3rem] font-bold mb-4">
        {selectedVideo.video.title}
      </h1>
      <video controls className="w-2/3 h-auto">
        <source
          src={`http://localhost:5000/${selectedVideo.video.videoUrl}`} // Use the video URL
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      <p className="text-gray-500 text-[1.5rem] mt-4">
        Published on: {new Date(selectedVideo.video.createdAt).toLocaleString()}
      </p>
    </div>
  );
};

export default VideoPlayer;
