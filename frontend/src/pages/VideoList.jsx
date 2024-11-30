import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Link } from "react-router-dom";
const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/videos/getvideo`,
          {
            method: "GET",
            // HTTP method
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch videos");
        }
        const data = await response.json();

        setVideos(data); // Set the videos from the API response
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex flex-row">
    <Sidebar />
    <div className="text-[1.8rem] w-full h-screen  bg-gray-100 p-10">
      <h2 className="text-[2.5rem] font-semibold">Video List</h2>
      <div className="mt-4 h-[90%] overflow-auto ">
        <ul className="flex flex-wrap gap-32">
          {videos.videos.map((video, index) => (
            <li
              key={video._id}
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 mb-6 p-4 border-b border-gray-300 flex flex-col items-center"
            >
              {/* Video Thumbnail with YouTube Aspect Ratio */}
              <Link to={`/video/${video._id}`} className="relative w-full">
                <div className="relative w-full pb-[56.25%] bg-black">
                  <img
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    src={video.videoUrl}
                    alt={video.title}
                  />
                </div>
              </Link>
  
              {/* Video Details */}
              <div className="text-center mt-4">
                <Link to={`/video/${video._id}`}>
                  <h3 className="text-[2rem] font-semibold hover:underline">
                    {video.title}
                  </h3>
                </Link>
                <p className="text-lg text-gray-500">
                  Published on: {new Date(video.createdAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
  

  );
};

export default VideoList;
