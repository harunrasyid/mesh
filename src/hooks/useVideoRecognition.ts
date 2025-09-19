import { create } from "zustand";
import type { Results } from "@mediapipe/hands";

type VideoRecognitionState = {
  videoElement: HTMLVideoElement | null;
  setVideoElement: (videoElement: HTMLVideoElement | null) => void;

  resultsCallback: ((results: Results) => void) | null;
  setResultsCallback: (cb: ((results: Results) => void) | null) => void;
};

export const useVideoRecognition = create<VideoRecognitionState>((set) => ({
  videoElement: null,
  setVideoElement: (videoElement) => set({ videoElement }),

  resultsCallback: null,
  setResultsCallback: (resultsCallback) => set({ resultsCallback }),
}));
