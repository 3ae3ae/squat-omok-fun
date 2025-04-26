
import React, { useRef, useEffect, useState } from 'react';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { cn } from '@/lib/utils';

interface VideoFeedProps {
  isLocal: boolean;
  onSquatDetected?: () => void;
  onPoseUpdate?: (points: any[]) => void;
  squatCount?: number;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ 
  isLocal, 
  onSquatDetected, 
  onPoseUpdate,
  squatCount = 0
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState<string>("");

  const {
    startDetection,
    stopDetection,
    isRunning,
    squatCount: detectedSquats,
    squatSpeed,
    resetSquats,
    jointPoints
  } = usePoseDetection({
    videoRef,
    onSquatDetected,
    onPoseUpdate
  });

  // Start camera when component mounts if this is local video
  useEffect(() => {
    if (isLocal) {
      startCamera();
    }
    
    return () => {
      if (isLocal) {
        stopCamera();
      }
    };
  }, [isLocal]);

  // Function to start the camera
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access not supported by your browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsVideoReady(true);
          startDetection();
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Failed to access camera. Please grant permission.");
    }
  };

  // Function to stop the camera
  const stopCamera = () => {
    stopDetection();
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsVideoReady(false);
  };

  // Display squat count
  const displayedSquatCount = isLocal ? detectedSquats : squatCount;

  return (
    <div className={cn(
      "relative rounded-lg overflow-hidden shadow-md bg-black",
      isLocal ? "border-2 border-gomoku-primary" : "border border-gray-400"
    )}>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-600 p-4 text-center">
          <p>{error}</p>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover"
        autoPlay 
        playsInline 
        muted
      />
      
      {/* Squat counter */}
      <div className="squat-counter">
        {displayedSquatCount % 3 === 0 ? `✓` : `${displayedSquatCount % 3}/3`}
      </div>
      
      {/* Speed indicator if local */}
      {isLocal && squatSpeed > 0 && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
          Speed: {squatSpeed} squats/min
        </div>
      )}
      
      {/* Render joint points for debugging */}
      {isLocal && jointPoints.length > 0 && jointPoints.map((point, i) => (
        <div 
          key={`joint-${i}`}
          className="absolute w-1 h-1 bg-red-500 rounded-full"
          style={{
            left: `${(point.x / 640) * 100}%`,
            top: `${(point.y / 480) * 100}%`
          }}
        />
      ))}
      
      {!isVideoReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
          {isLocal ? "Starting camera..." : "Waiting for opponent..."}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
