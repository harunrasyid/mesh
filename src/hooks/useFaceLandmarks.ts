// src/hooks/useFaceLandmarks.ts
import { useEffect, useState } from "react";
import { useVideoRecognition } from "./useVideoRecognition";
import type { NormalizedLandmarkList } from "@mediapipe/holistic";

export function useFaceLandmarks() {
  const [landmarks, setLandmarks] = useState<NormalizedLandmarkList | null>(
    null
  );

  useEffect(() => {
    useVideoRecognition.getState().setResultsCallback((results) => {
      if (results.faceLandmarks) {
        setLandmarks(results.faceLandmarks);
      }
    });
  }, []);

  return landmarks;
}
