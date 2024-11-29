import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Link } from "react-router-dom";

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchVideos = async () => {
//       try {
//         const response = await fetch("https://your-api-endpoint.com/videos"); // Replace with your API endpoint
//         if (!response.ok) {
//           throw new Error("Failed to fetch videos");
//         }
//         const data = await response.json();

//         setVideos(data); // Set the videos from the API response
//       } catch (error) {
//         setError(error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchVideos();
//   }, []);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (error) {
//     return <div>Error: {error}</div>;
//   }

  return (
    <div className="flex flex-row">
      <Sidebar />
      <div className="text-[1.8rem] w-full bg-gray-100 p-6">
        <h2 className="text-[2.5rem] font-semibold">Video List</h2>
        <div className="mt-4">
          {videos.length > 0 ? (
            <ul>
              {videos.map((video) => (
                <li key={video.id} className="mb-4">
                   <Link
                    to={`/video/${video.id}`}
                    className="flex items-center space-x-4 hover:bg-gray-200 p-2 rounded"
                  >
                    <div className="w-32 h-32 bg-gray-300">
                      <img
                        src={video.videourl} // Replace with thumbnail URL
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{video.title}</h3>
                      <p className="text-sm text-gray-500">
                        Published on:{" "}
                        {new Date(video.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[1.5rem]">No videos available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoList;
