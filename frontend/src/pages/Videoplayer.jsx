

import React, { useEffect, useRef, useState } from "react";
import shaka from "shaka-player";

const VideoPlayer = () => {
  const videoRef = useRef(null); // Reference to the video element
  const [manifestUri, setManifestUri] = useState(
    "https://testdrm-video-bucket.s3.ap-south-1.amazonaws.com/1733317265000-52ec6bb3-5ad3-4ac3-91f3-3fe2cf2f967f.mpd" // Replace with your MPD URL
  );
  let license_token = `eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJ0ZXN0LXVzZXIiLCJkcm1fdHlwZSI6IldpZGV2aW5lIiwic2l0ZV9pZCI6IkhVVkciLCJoYXNoIjoiZ2dTZEZ5YnRXQlpxRlRJWTZRUTlUcnV4M09yQTlIODlsamFaV0ZDc2l6VT0iLCJjaWQiOiJkYXNoX21lZGlhY29udmVydF90ZXN0IiwicG9saWN5IjoicjBVMGFkL0huWkdCS2RyUWxCYWF5QT09IiwidGltZXN0YW1wIjoiMjAyNC0xMi0wNlQwNTozNjozNVoifQ==
`;
  const drmConfig = {
    servers: {
      "com.widevine.alpha":
        "https://license-global.pallycon.com/ri/licenseManager.do",
      // 'com.microsoft.playready': 'https://foo.bar/drm/playready',
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
        request.headers["pallycon-customdata-v2"] = license_token;
      }
    });
    player.addEventListener("error", onErrorEvent);
    try {
      await player.load(manifestUri);
      console.log("The video has now been loaded!");
    } catch (error) {
      onError(error);
    }
  };

  const onErrorEvent = (event) => {
    console.error("Error event:", event.detail);
  };

  const onError = (error) => {
    console.error("Error:", error);
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
    if (manifestUri) {
      initApp();
    }

    return () => {
      // Cleanup the Shaka Player instance if needed
      if (window.player) {
        window.player.destroy();
      }
    };
  }, [manifestUri]); // Re-initialize if manifestUri changes

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h2 style={{ fontSize: "4.5rem" }}>Shaka Player - Video Streaming</h2>
      <video
        ref={videoRef}
        id="video"
        controls
        width="640"
        height="360"
        style={{ backgroundColor: "black", border: "1px solid #ccc" }}
      />
      <div style={{ fontSize: "2.5rem", marginTop: "10px" }}>
        <div>Shaka player plays the video with DRM protected</div>
      </div>
    </div>
  );
};

export default VideoPlayer;
