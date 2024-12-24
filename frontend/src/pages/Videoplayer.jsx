// import React from "react";
// import { useParams, useLocation, useNavigate } from "react-router-dom";
// import { BiArrowBack } from "react-icons/bi";

// const VideoPlayer = () => {
//   const { title } = useParams(); // Get video ID from URL
//   const location = useLocation(); // Get the location object
//   const selectedVideo = location.state?.selectedVideo; // Access the passed state
//   const navigate = useNavigate();
//   // If video data is not available, you can fetch it using the title or display an error
//   if (!selectedVideo) {
//     return <div>No video found for the title: {title}</div>;
//   }
//   const handleClick = (e) => {
//     e.preventDefault();
//     navigate("/videoList");
//   };

//   return (
//     <div className="flex flex-col items-center p-6 bg-[#f0f0f0] min-h-screen">
//       <button
//         onClick={handleClick}
//         className="absolute top-6 left-6 flex items-center px-4 py-2 bg-[#86a037] text-white rounded-full shadow-lg hover:bg-[#586a23] transition duration-300"
//       >
//         <BiArrowBack size={24} />
//       </button>
//       <h1 className="text-[3rem] font-bold mb-4">
//         {selectedVideo.video.title}
//       </h1>
//       <video controls className="w-2/3 h-auto">
//         <source
//           src={selectedVideo.video.videoUrl} // Use the video URL
//           type="video/mp4"
//         />
//         Your browser does not support the video tag.
//       </video>
//       <p className="text-gray-500 text-[1.5rem] mt-4">
//         Published on: {new Date(selectedVideo.video.createdAt).toLocaleString()}
//       </p>
//     </div>
//   );
// };

// export default VideoPlayer;

import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { BounceLoader } from "react-spinners";
import shaka from "shaka-player";

const VideoPlayer = () => {
  const videoRef = useRef(null); // Reference to the video element
  const { title } = useParams(); // Get video ID from URL
  const location = useLocation(); // Get the location object
  const navigate = useNavigate();
  const selectedVideo = location.state?.selectedVideo; // Access the passed state
  const [isLoading, setIsLoading] = useState(false); 

  const drmConfig = {
    servers: {
      "com.widevine.alpha":
        "https://license-global.pallycon.com/ri/licenseManager.do", // Widevine license server

      "com.microsoft.playready":
        "https://license-global.pallycon.com/ri/licenseManager.do", // PlayReady license server
    },
  };

  const initPlayer = async () => {
    const video = videoRef.current;
    const player = new shaka.Player(video);
    window.player = player;

    player.configure({ drm: drmConfig });

    // Add custom headers to license requests
    player.getNetworkingEngine().registerRequestFilter((type, request) => {
      if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
        request.headers["pallycon-customdata-v2"] =
          selectedVideo.video.licenseToken;
      }
    });
    player.addEventListener("error", onErrorEvent);
    try {
      await player.load(selectedVideo.video.dashMpdUrl);
      console.log("The video has now been loaded!");
    } catch (error) {
      onError(error);
    }
  };

  const onErrorEvent = (event) => {
    console.error("Error event:", event.detail);
  };

  const onError = (error) => {
    console.error("Error code:", error.code, "Details:", error.data);
  };

  const initApp = () => {
    shaka.polyfill.installAll();

    if (shaka.Player.isBrowserSupported()) {
      initPlayer();
    } else {
      console.error("Browser not supported!");
    }
  };

  useEffect(() => {
    if (selectedVideo.video.dashMpdUrl) {
      initApp();
    }

    return () => {
      // Cleanup the Shaka Player instance if needed
      if (window.player) {
        window.player.destroy();
      }
    };
  }, [selectedVideo.video.dashMpdUrl]); // Re-initialize if manifestUri changes

  const handleBackClick = (e) => {
    e.preventDefault();
    setIsLoading(true); // Show spinner when the back button is clicked
    
    // Delay navigation to ensure spinner is visible
    setTimeout(() => {
      navigate("/videoList"); // Navigate after the timeout
      setIsLoading(false); // Hide spinner after navigation
    }, 500); // Adjust delay to give enough time for the spinner to show
  };

  return (
    <div>
      <button
        onClick={handleBackClick}
        className="absolute top-6 left-6 flex items-center px-4 py-2 bg-[#3f99ad] text-white rounded-full shadow-lg hover:bg-[#53acb8] transition duration-300"
      >
        <BiArrowBack size={24} />
      </button>

      {/* Show the spinner only when loading */}
      {/* {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <BounceLoader size={60} color="#1746d4" />
        </div>
      )} */}

      <div style={{ textAlign: "center", margin: "20px" }}>
        <h2 style={{ fontSize: "4.5rem" }}>{selectedVideo.video.title}</h2>
        <div className="flex justify-center mt-6">
          <video
            ref={videoRef}
            id="video"
            controls
            width="640"
            height="360"
            className="w-2/3 h-auto bg-black border border-gray-300 rounded-lg mt-4 shadow-md"
          />
        </div>
        {/* Additional content */}
        <div style={{ fontSize: "2.5rem", marginTop: "10px" }}>
          <div>"Shaka Player streams video content with robust DRM protection enabled."</div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
