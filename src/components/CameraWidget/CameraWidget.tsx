import { useVideoRecognition } from "@/hooks/useVideoRecognition";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS, Hands, type Results } from "@mediapipe/hands";
import { useEffect, useRef, useState } from "react";
import { Box, IconButton, VStack } from "@chakra-ui/react";
import { StopCircle, PlayCircle } from "lucide-react";

function isPinching(landmarks: { x: number; y: number }[]) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const dx = thumbTip.x - indexTip.x;
  const dy = thumbTip.y - indexTip.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  console.log("isPinching", distance < 0.05);
  return distance < 0.05; // adjust threshold
}

export const CameraWidget: React.FC = () => {
  const [start, setStart] = useState<boolean>(false);

  const videoElement = useRef<HTMLVideoElement | null>(null);
  const drawCanvas = useRef<HTMLCanvasElement | null>(null);

  const setVideoElement = useVideoRecognition(
    (state) => state?.setVideoElement
  );

  // gesture state
  const isDraggingRef = useRef(false);
  const lastYRef = useRef(0);

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

    // Draw hands
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: "#22c3e3",
          lineWidth: 4,
        });
        drawLandmarks(canvasCtx, landmarks, {
          color: "#ff0364",
          lineWidth: 2,
        });

        // 👉 handle gesture (pinch + drag)
        if (isPinching(landmarks)) {
          const handY = landmarks[9].y; // middle of the palm
          if (!isDraggingRef.current) {
            console.log("dragging");
            isDraggingRef.current = true;
            lastYRef.current = handY;
          } else {
            const deltaY = (handY - lastYRef.current) * 1000; // scale
            window.scrollBy(0, deltaY);
            lastYRef.current = handY;
          }
        } else {
          isDraggingRef.current = false;
          console.log("not dragging");
        }
      }
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

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: Results) => {
      drawResults(results);
      useVideoRecognition.getState().resultsCallback?.(results);
    });

    const camera = new Camera(videoElement.current, {
      onFrame: async () => {
        await hands.send({ image: videoElement.current! });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  }, [start, setVideoElement]);

  return (
    <VStack
      css={{
        display: "flex",
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 20,
      }}
    >
      {/* Floating button */}
      <IconButton
        aria-label={start ? "Stop camera" : "Start camera"}
        onClick={() => setStart((prev) => !prev)}
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
          rounded="xl"
          overflow="hidden"
          zIndex={9999}
          css={{
            position: "relative",
            w: "320px",
            h: "240px",
            rounded: "xl",
            overflow: "hidden",
            zIndex: 9999,
          }}
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
    </VStack>
  );
};
