import React, { useState,useRef } from "react";
import Sidebar from "../components/Sidebar";
import { TfiVideoClapper } from "react-icons/tfi";

const UploadVideo = () => {
  const fileInputRef = useRef(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);

  const handleButtonClick = () => {
    // Trigger the hidden file input
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        setUploadedVideo(file.name); 
      }
  };
  return (
    <div className="flex flex-row">
      <Sidebar />
      <div className="flex items-center w-full justify-center min-h-screen bg-gray-100">
        <div className="text-[1.8rem]  border bg-[#edf0e2] p-6 rounded-lg shadow-lg">
          <div className="flex flex-col text-[1.8rem] h-[50vh] justify-center items-center space-y-4">
            <h1 className="text-center font-bold max-w-sm text-gray-800">
              Upload your video if you want to check it is DRM protected or not.
            </h1>
            <div className="flex flex-col items-center space-y-2">
              <TfiVideoClapper className="text-[9rem] text-gray-700" />
              <button
                onClick={handleButtonClick}
                className="px-10 py-4 bg-[#d6e7a1] text-[1.5rem] text-black rounded-lg shadow hover:bg-[#b2ce5f]"
              >
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*" // Only video files
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {uploadedVideo && (
              <div className="mt-4">
                <h3 className="text-[1.3rem] font-semibold text-gray-800">
                  Uploaded Video:
                </h3>
               <p className="text-[1.3rem]">{uploadedVideo}</p>
              </div>
            )}
            <h5 className="text-center max-w-lg text-gray-700">
              Upload your video if you want to check it is DRM protected or not.
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadVideo;
