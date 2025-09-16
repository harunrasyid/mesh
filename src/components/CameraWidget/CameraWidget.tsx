// src/components/CameraWidget.tsx
import { useVideoRecognition } from "@/hooks/useVideoRecognition";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import {
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  Holistic,
  POSE_CONNECTIONS,
  type Results,
} from "@mediapipe/holistic";
import { useEffect, useRef, useState } from "react";
import { Box, IconButton } from "@chakra-ui/react";
import { StopCircle, PlayCircle } from "lucide-react";

export const CameraWidget: React.FC = () => {
  const [start, setStart] = useState<boolean>(false);

  const videoElement = useRef<HTMLVideoElement | null>(null);
  const drawCanvas = useRef<HTMLCanvasElement | null>(null);

  const setVideoElement = useVideoRecognition(
    (state) => state?.setVideoElement
  );

  const drawResults = (results: Results) => {
    if (!drawCanvas.current || !videoElement.current) return;

    const canvas = drawCanvas.current;
    const video = videoElement.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Pose
    if (results.poseLandmarks) {
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#00cff7",
        lineWidth: 4,
      });
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: "#ff0364",
        lineWidth: 2,
      });
    }

    // Face
    if (results.faceLandmarks) {
      drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
        color: "#C0C0C070",
        lineWidth: 1,
      });
      if (results.faceLandmarks.length === 478) {
        drawLandmarks(
          canvasCtx,
          [results.faceLandmarks[468], results.faceLandmarks[473]],
          {
            color: "#ffe603",
            lineWidth: 2,
          }
        );
      }
    }

    // Left hand
    if (results.leftHandLandmarks) {
      drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
        color: "#eb1064",
        lineWidth: 5,
      });
      drawLandmarks(canvasCtx, results.leftHandLandmarks, {
        color: "#00cff7",
        lineWidth: 2,
      });
    }

    // Right hand
    if (results.rightHandLandmarks) {
      drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
        color: "#22c3e3",
        lineWidth: 5,
      });
      drawLandmarks(canvasCtx, results.rightHandLandmarks, {
        color: "#ff0364",
        lineWidth: 2,
      });
    }

    canvasCtx.restore();
  };

  useEffect(() => {
    if (!start) {
      setVideoElement(null);
      return;
    }

    if (useVideoRecognition.getState().videoElement) {
      return;
    }

    if (!videoElement.current) return;

    setVideoElement(videoElement.current);

    const holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      refineFaceLandmarks: true,
    });

    holistic.onResults((results: Results) => {
      drawResults(results);
      useVideoRecognition.getState().resultsCallback?.(results);
    });

    const camera = new Camera(videoElement.current, {
      onFrame: async () => {
        await holistic.send({ image: videoElement.current! });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  }, [start, setVideoElement]);

  return (
    <>
      {/* Floating button */}
      <IconButton
        aria-label={start ? "Stop camera" : "Start camera"}
        onClick={() => setStart((prev) => !prev)}
        position="fixed"
        bottom="1rem"
        right="1rem"
        zIndex={20}
        rounded="full"
        p={4}
        color="white"
        bg={start ? "red.500" : "blue.500"}
        _hover={{ bg: start ? "red.600" : "blue.600" }}
        shadow="md"
      >
        {start ? <StopCircle /> : <PlayCircle />}
      </IconButton>

      {/* Camera view */}
      {start && (
        <Box
          position="absolute"
          bottom="6rem"
          right="1rem"
          w="320px"
          h="240px"
          rounded="xl"
          overflow="hidden"
          zIndex={9999}
        >
          <canvas
            ref={drawCanvas}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              zIndex: 10,
            }}
          />
          <video
            ref={videoElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
            }}
            playsInline
          />
        </Box>
      )}
    </>
  );
};
