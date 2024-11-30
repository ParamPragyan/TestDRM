import React from 'react';
import { useParams } from 'react-router-dom';

const VideoPlayer = ({ videos }) => {
  const { videoId } = useParams(); // Get video ID from URL

  // Find the selected video based on videoId
  const video = videos.find((video) => video._id === videoId);

  if (!video) {
    return <div>Video not found!</div>;
  }

  return (
    <div className="flex flex-col items-center p-6 bg-[#f0f0f0] min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
      <video controls className="w-3/4 h-auto">
        <source
          src={video.videoUrl} // Use the video URL
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      <p className="text-gray-500 mt-4">
        Published on: {new Date(video.createdAt).toLocaleString()}
      </p>
    </div>
  );
};

export default VideoPlayer;
