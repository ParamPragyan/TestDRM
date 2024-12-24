import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { SlControlPlay } from "react-icons/sl";
import { BounceLoader } from "react-spinners";

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const navigate = useNavigate(); // Initialize the navigate function

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/videos/videos`,
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
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <BounceLoader size={60} color="#050e2b" />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const getVideo = async (title) => {
    try {
      // Encode the title to ensure it's safe for use in a URL
      const response = await fetch(
        `http://localhost:5000/api/videos/videos/${encodeURIComponent(title)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch video data");
      }
      const data = await response.json();
      setSelectedVideo(data);
      // Navigate to the VideoPlayer page with the video title as a URL parameter
      navigate(`/video/${encodeURIComponent(title)}`, {
        state: { selectedVideo: data },
      });
    } catch (error) {
      console.error("Error fetching video data:", error);
    }
  };

  return (
    <div className="flex flex-row">
      <Sidebar />
      <div className="text-[1.8rem] w-full h-screen  bg-gray-100 p-10">
        <h2 className="text-[2.5rem] font-semibold">Video List</h2>
        <div className="mt-4 h-[90%] overflow-auto ">
          <ul className="flex flex-wrap ">
            {videos.videos
              .slice()
              .reverse()
              .map((video, index) => (
                <li
                  key={video._id}
                  className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 mb-6 p-4 border-b border-gray-300 flex flex-col items-center"
                >
                  {/* Video Thumbnail with YouTube Aspect Ratio */}
                  <div className="relative w-full pb-[56.25%] bg-black">
                    <div
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      src={video.videoUrl}
                      alt={video.title}
                    />
                    <button
                      onClick={() => getVideo(video.title)}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-[5rem] font-bold hover:bg-opacity-75"
                    >
                      <SlControlPlay />
                    </button>
                  </div>

                  {/* Video Details */}
                  <div className="text-center mt-4">
                    <h3 className="text-[2rem] font-semibold hover:underline">
                      {video.title}
                    </h3>

                    {/* <p className="text-lg text-gray-500">
                      Published on: {new Date(video.createdAt).toLocaleString()}
                    </p> */}
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
