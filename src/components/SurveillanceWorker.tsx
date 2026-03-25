/* eslint-disable */
import * as faceapi from "face-api.js";
import { useEffect, useRef } from "react";
import { useCCTV } from "../pages/context/CCTVContext";

const SurveillanceWorker = () => {
  const { faceMatcher, addLog } = useCCTV();
  const workerCanvas = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const isProcessing = useRef(false); // Prevents overlapping processing loops

  useEffect(() => {
    // Only start if we have the face database (faceMatcher) and the canvas is ready
    if (!faceMatcher || !workerCanvas.current) return;

    // Initialize hidden JSMpeg player
    if (!(window as any).JSMpeg) {
      console.error("SurveillanceWorker: JSMpeg not found on window object.");
      return;
    }

    // Connect to the stream in the background
    playerRef.current = new (window as any).JSMpeg.Player(
      import.meta.env.VITE_WS_CAM_1,
      {
        canvas: workerCanvas.current,
        autoplay: true,
        audio: false,
        disableGl: true, // Use 2D context for easier face-api sampling
      },
    );

    const processFrame = async () => {
      if (!workerCanvas.current || !faceMatcher || isProcessing.current) return;

      isProcessing.current = true;

      try {
        // 🔥 FIX: You MUST call .withFaceLandmarks() before .withFaceDescriptors()
        const detections = await faceapi
          .detectAllFaces(
            workerCanvas.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }),
          )
          .withFaceLandmarks() // 👈 This solves the ts(2339) error
          .withFaceDescriptors();

        // 🔥 FIX: Explicitly type 'det' to solve ts(7006)
        detections.forEach(
          (
            det: faceapi.WithFaceDescriptor<
              faceapi.WithFaceLandmarks<
                { detection: faceapi.FaceDetection },
                faceapi.FaceLandmarks
              >
            >,
          ) => {
            const bestMatch = faceMatcher.findBestMatch(det.descriptor);

            if (bestMatch.label !== "unknown") {
              const [name, id] = bestMatch.label.split("__");

              addLog({
                _id: Math.random().toString(36).substr(2, 9),
                visitorId: id,
                visitorName: name,
                cameraName: "Main Entrance",
                confidence: Math.round((1 - bestMatch.distance) * 100),
                screenshotBase64: workerCanvas.current?.toDataURL(
                  "image/jpeg",
                  0.5,
                ),
                status: "IN",
                timestamp: new Date().toISOString(),
              });
            }
          },
        );
      } catch (err) {
        // Suppress background errors to keep console clean
      } finally {
        isProcessing.current = false;
        // Run again after a 1-second delay to balance security vs CPU usage
        setTimeout(processFrame, 1000);
      }
    };

    // Start the detection loop
    const startDelay = setTimeout(processFrame, 2000);

    return () => {
      clearTimeout(startDelay);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [faceMatcher, addLog]);

  return (
    <div
      id="rtu-background-surveillance-node"
      style={{
        position: "fixed",
        left: -9999,
        top: -9999,
        pointerEvents: "none",
        visibility: "hidden",
        zIndex: -1,
      }}
    >
      {/* Hidden processing canvas */}
      <canvas ref={workerCanvas} width="640" height="360" />
    </div>
  );
};

export default SurveillanceWorker;
