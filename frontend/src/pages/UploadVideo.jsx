import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const UploadVideo = () => {
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  // const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  const navigate = useNavigate(); 

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoFile || !title) {
       toast.error("Please provide both a title and a video file.");
       return;
    }

    setLoading(true);
    // Create FormData for upload
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("title", title);

    try {
      const response = await fetch("http://localhost:5000/api/videos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        console.log(data);
        // toast.success(data.message);
        navigate(`/videoList`)
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      // Turn off loading after upload completes
      setLoading(false);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      console.log("Video file:", file);
    } else {
      alert("Please drop a valid video file.");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="flex flex-row">
      <Sidebar />
      <div className="w-full bg-gray-100 flex justify-center items-center h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg w-[80%]">
          <h2 className="text-[2.8rem] p-4 border-b-2 mb-6 text-center">
            Upload Video
          </h2>
          <form className="flex flex-col items-center" onSubmit={handleSubmit}>
            <div className="w-full mb-6">
              <label className="text-[2.1rem] block mb-2">Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-[1.8rem] w-full p-4 border border-gray-300 rounded-md focus:outline-none "
              />
            </div>

            <div
              className="w-full h-[30rem] border-dashed border-2 border-gray-400 flex flex-col items-center justify-center bg-white rounded-md text-[1.8rem] cursor-pointer mb-6 relative"
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              {/* Video Preview or Instruction */}
              {videoFile ? (
                <video
                  className="w-[50rem] h-[90%] object-cover"
                  controls
                  src={URL.createObjectURL(videoFile)} // Generate a preview URL for the video
                ></video>
              ) : (
                <p className="text-center text-[1.8rem]">
                  Drag & drop a video file, or click to upload
                </p>
              )}

              {/* Custom "Browse Video" button */}
              {!videoFile && (
                <button
                  className="absolute bottom-4 bg-[#9caa71] text-white px-8 py-4 text-[1.8rem] rounded-md hover:bg-[#bdcc8f] transition"
                  type="button"
                  onClick={() => document.getElementById("fileInput").click()}
                >
                  Browse Video
                </button>
              )}

              {/* Hidden file input */}
              <input
                id="fileInput"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* <button
            className="bg-[#86a037] text-white px-8 py-4 text-[1.8rem] rounded-md hover:bg-[#acce46] transition"
            type="submit"
          >
            Upload
          </button> */}
            <button
              className="bg-[#86a037] text-white px-8 py-4 text-[1.8rem] rounded-md hover:bg-[#acce46] transition flex items-center justify-center"
              type="submit"
              disabled={loading} // Disable button while loading
            >
              {loading ? (
                <div
                  className="w-10 h-10 border-4 border-t-4 border-gray-200 border-t-[#86a037] rounded-full animate-spin"
                  aria-label="Loading"
                ></div>
              ) : (
                "Upload"
              )}
            </button>
          </form>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="text-2xl font-medium" // Apply larger text size to the toast
            bodyClassName="text-2xl"
          />

          {/* {uploadStatus && (
            <p className="text-[1.8rem] mt-4 text-center">{uploadStatus}</p>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default UploadVideo;
