import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import type { Results, NormalizedLandmark } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface GestureData {
  handDetected: boolean;
  palmX: number; // Normalized 0-1, where 0.5 is center
  isPinching: boolean;
  gestureSpeed: number; // -1 to 1, negative is left, positive is right
}

export interface UseGestureControlOptions {
  onGestureUpdate?: (gesture: GestureData) => void;
  enabled?: boolean;
}

export function useGestureControl(options: UseGestureControlOptions = {}) {
  const { onGestureUpdate, enabled = true } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const onGestureUpdateRef = useRef(onGestureUpdate);

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGesture, setCurrentGesture] = useState<GestureData>({
    handDetected: false,
    palmX: 0.5,
    isPinching: false,
    gestureSpeed: 0
  });

  // Keep the callback ref up to date
  useEffect(() => {
    onGestureUpdateRef.current = onGestureUpdate;
  }, [onGestureUpdate]);

  const calculateDistance = useCallback(
    (point1: NormalizedLandmark, point2: NormalizedLandmark) => {
      const dx = point1.x - point2.x;
      const dy = point1.y - point2.y;
      const dz = point1.z - point2.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    []
  );

  const detectHandClosure = useCallback(
    (landmarks: NormalizedLandmark[]) => {
      // Multiple detection methods for better reliability

      // 1. Check if thumb and index are pinched
      const thumbIndexDistance = calculateDistance(landmarks[4], landmarks[8]);
      const thumbIndexPinch = thumbIndexDistance < 0.06;

      // 2. Check if thumb and middle finger are pinched
      const thumbMiddleDistance = calculateDistance(
        landmarks[4],
        landmarks[12]
      );
      const thumbMiddlePinch = thumbMiddleDistance < 0.06;

      // 3. Detect fist: all fingertips close to palm center
      const palmCenter = landmarks[9]; // Middle finger MCP joint (base)
      const fingertips = [
        landmarks[8], // Index tip
        landmarks[12], // Middle tip
        landmarks[16], // Ring tip
        landmarks[20] // Pinky tip
      ];

      const fingertipDistances = fingertips.map(tip =>
        calculateDistance(tip, palmCenter)
      );
      const averageFingertipDistance =
        fingertipDistances.reduce((a, b) => a + b, 0) /
        fingertipDistances.length;
      const isFist = averageFingertipDistance < 0.12; // All fingers close to palm

      // 4. Check finger curl by comparing fingertip Y-positions with their base joints
      const indexCurled = landmarks[8].y > landmarks[6].y; // Index tip below PIP joint
      const middleCurled = landmarks[12].y > landmarks[10].y; // Middle tip below PIP joint
      const ringCurled = landmarks[16].y > landmarks[14].y; // Ring tip below PIP joint
      const pinkyCurled = landmarks[20].y > landmarks[18].y; // Pinky tip below PIP joint

      const curledFingerCount = [
        indexCurled,
        middleCurled,
        ringCurled,
        pinkyCurled
      ].filter(Boolean).length;
      const mostFingersCurled = curledFingerCount >= 3; // At least 3 fingers curled

      // 5. Check if all fingertips are close together (pinching gesture)
      const allFingertips = [
        landmarks[4], // Thumb tip
        landmarks[8], // Index tip
        landmarks[12], // Middle tip
        landmarks[16], // Ring tip
        landmarks[20] // Pinky tip
      ];

      // Calculate centroid of all fingertips
      const centroidX =
        allFingertips.reduce((sum, tip) => sum + tip.x, 0) /
        allFingertips.length;
      const centroidY =
        allFingertips.reduce((sum, tip) => sum + tip.y, 0) /
        allFingertips.length;
      const centroidZ =
        allFingertips.reduce((sum, tip) => sum + tip.z, 0) /
        allFingertips.length;
      const centroid = {
        x: centroidX,
        y: centroidY,
        z: centroidZ
      } as NormalizedLandmark;

      const maxDistanceFromCentroid = Math.max(
        ...allFingertips.map(tip => calculateDistance(tip, centroid))
      );
      const allFingersTogether = maxDistanceFromCentroid < 0.08; // All fingertips clustered together

      // Return true if ANY of these conditions are met
      return (
        thumbIndexPinch ||
        thumbMiddlePinch ||
        isFist ||
        mostFingersCurled ||
        allFingersTogether
      );
    },
    [calculateDistance]
  );

  const calculateGestureSpeed = useCallback((palmX: number) => {
    // Palm position: 0 (left edge) to 1 (right edge)
    // Center is 0.5
    const deadZone = 0.05; // Small center dead zone (0.45 to 0.55)
    const maxRange = 0.45; // Range from edge of dead zone to edge of screen

    if (palmX > 0.5 + deadZone) {
      // Moving right - cards should move right (positive direction)
      const intensity = (palmX - (0.5 + deadZone)) / maxRange;
      return Math.min(1, intensity);
    } else if (palmX < 0.5 - deadZone) {
      // Moving left - cards should move left (negative direction)
      const intensity = (0.5 - deadZone - palmX) / maxRange;
      return -Math.min(1, intensity);
    }

    return 0;
  }, []);

  const onResults = useCallback(
    (results: Results) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions if not already set
      if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = 640;
        canvas.height = 480;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let gestureData: GestureData = {
        handDetected: false,
        palmX: 0.5,
        isPinching: false,
        gestureSpeed: 0
      };

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Get palm center (average of landmarks 0, 5, 9, 13, 17 - base of each finger)
        const palmX =
          (landmarks[0].x +
            landmarks[5].x +
            landmarks[9].x +
            landmarks[13].x +
            landmarks[17].x) /
          5;

        // Check for hand closure (pinch, fist, or fingers together)
        const isPinching = detectHandClosure(landmarks);

        // Calculate gesture speed based on palm position
        const gestureSpeed = calculateGestureSpeed(palmX);

        gestureData = {
          handDetected: true,
          palmX,
          isPinching,
          gestureSpeed
        };

        // Draw hand landmarks for visual feedback
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        landmarks.forEach((landmark: NormalizedLandmark) => {
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvas.width,
            landmark.y * canvas.height,
            5,
            0,
            2 * Math.PI
          );
          ctx.fill();
        });

        // Draw connections
        const connections = [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4], // Thumb
          [0, 5],
          [5, 6],
          [6, 7],
          [7, 8], // Index
          [0, 9],
          [9, 10],
          [10, 11],
          [11, 12], // Middle
          [0, 13],
          [13, 14],
          [14, 15],
          [15, 16], // Ring
          [0, 17],
          [17, 18],
          [18, 19],
          [19, 20], // Pinky
          [5, 9],
          [9, 13],
          [13, 17] // Palm
        ];

        ctx.strokeStyle = isPinching
          ? 'rgba(255, 0, 0, 0.8)'
          : 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;

        connections.forEach(([start, end]) => {
          ctx.beginPath();
          ctx.moveTo(
            landmarks[start].x * canvas.width,
            landmarks[start].y * canvas.height
          );
          ctx.lineTo(
            landmarks[end].x * canvas.width,
            landmarks[end].y * canvas.height
          );
          ctx.stroke();
        });
      }

      setCurrentGesture(gestureData);
      onGestureUpdateRef.current?.(gestureData);
    },
    [detectHandClosure, calculateGestureSpeed]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Don't reinitialize if already initialized (check refs, not state)
    if (handsRef.current && cameraRef.current) {
      return;
    }

    let isMounted = true;

    const initializeHandTracking = async () => {
      try {
        // Create video element
        const video = document.createElement('video');
        video.style.display = 'none';
        videoRef.current = video;

        // Wait for canvas to be available from the component
        // Canvas will be set via the ref in the component

        // Initialize MediaPipe Hands
        const hands = new Hands({
          locateFile: file => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        hands.onResults(onResults);
        handsRef.current = hands;

        // Initialize camera
        const camera = new Camera(video, {
          onFrame: async () => {
            if (handsRef.current) {
              await handsRef.current.send({ image: video });
            }
          },
          width: 640,
          height: 480
        });

        cameraRef.current = camera;
        await camera.start();

        if (isMounted) {
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to initialize camera'
          );
          console.error('Gesture control initialization error:', err);
        }
      }
    };

    initializeHandTracking();

    return () => {
      isMounted = false;

      // Cleanup resources on unmount or when enabled changes
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }

      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }

      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        videoRef.current = null;
      }

      // Reset state after cleanup
      setIsInitialized(false);
    };
  }, [enabled, onResults]);

  return {
    isInitialized,
    error,
    currentGesture,
    videoRef,
    canvasRef
  };
}
