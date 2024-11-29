import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const VideoPlayer = () => {
  const { videoId } = useParams(); // Get video ID from URL
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await fetch(`https://your-api-endpoint.com/videos/${videoId}`); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch video");
        }
        const data = await response.json();
        setVideo(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) {
    return <div>Loading video...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!video) {
    return <div>Video not found!</div>;
  }

  return (
    <div className="flex flex-row">
      <Sidebar />
    <div className="flex flex-col items-center p-6 bg-[#f0f0f0] min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
      <video controls className="w-3/4 h-auto">
        <source src={video.videourl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <p className="text-gray-500 mt-4">
        Published on: {new Date(video.createdAt).toLocaleString()}
      </p>
    </div>
    </div>
  );
};

export default VideoPlayer;
