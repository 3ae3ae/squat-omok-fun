
import { useEffect, useState, useRef } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

interface JointPoint {
  name: string;
  x: number;
  y: number;
}

interface PoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onSquatDetected?: () => void;
  onPoseUpdate?: (points: JointPoint[]) => void;
}

interface SquatState {
  isDown: boolean;
  lastChangeTime: number;
  count: number;
}

export const usePoseDetection = ({
  videoRef,
  onSquatDetected,
  onPoseUpdate
}: PoseDetectionProps) => {
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [squats, setSquats] = useState<SquatState>({ isDown: false, lastChangeTime: 0, count: 0 });
  const [squatSpeed, setSquatSpeed] = useState<number>(0); // Squat speed in squats per minute
  const [jointPoints, setJointPoints] = useState<JointPoint[]>([]);
  const requestIdRef = useRef<number | null>(null);
  
  // Load the pose detector model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        };
        
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet, 
          detectorConfig
        );
        
        setDetector(detector);
      } catch (error) {
        console.error('Failed to load pose detection model', error);
      }
    };
    
    loadModel();
    
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);

  // Start detection loop
  const startDetection = () => {
    if (!detector || !videoRef.current || isRunning) return;
    
    setIsRunning(true);
    runPoseDetection();
  };

  // Stop detection loop
  const stopDetection = () => {
    setIsRunning(false);
    if (requestIdRef.current) {
      cancelAnimationFrame(requestIdRef.current);
      requestIdRef.current = null;
    }
  };

  // Reset squats counter
  const resetSquats = () => {
    setSquats({ isDown: false, lastChangeTime: 0, count: 0 });
    setSquatSpeed(0);
  };

  // The main detection loop
  const runPoseDetection = async () => {
    if (!detector || !videoRef.current || !isRunning) return;
    
    try {
      const video = videoRef.current;
      const poses = await detector.estimatePoses(video);
      
      if (poses.length > 0) {
        const pose = poses[0];
        
        // Convert keypoints to our JointPoint format
        const points: JointPoint[] = pose.keypoints.map(kp => ({
          name: kp.name || '',
          x: kp.x,
          y: kp.y,
        }));
        
        setJointPoints(points);
        
        // Send pose data to parent component if callback provided
        if (onPoseUpdate) {
          onPoseUpdate(points);
        }
        
        // Detect squats
        detectSquat(pose);
      }
    } catch (error) {
      console.error('Error in pose detection:', error);
    }
    
    // Continue the detection loop
    if (isRunning) {
      requestIdRef.current = requestAnimationFrame(runPoseDetection);
    }
  };

  // Squat detection logic
  const detectSquat = (pose: poseDetection.Pose) => {
    const knees = pose.keypoints.filter(kp => 
      kp.name === 'left_knee' || kp.name === 'right_knee'
    );
    
    const hips = pose.keypoints.filter(kp => 
      kp.name === 'left_hip' || kp.name === 'right_hip'
    );
    
    const ankles = pose.keypoints.filter(kp => 
      kp.name === 'left_ankle' || kp.name === 'right_ankle'
    );
    
    if (knees.length < 2 || hips.length < 2 || ankles.length < 2) return;
    
    // Calculate average Y positions
    const kneeY = (knees[0].y + knees[1].y) / 2;
    const hipY = (hips[0].y + hips[1].y) / 2;
    const ankleY = (ankles[0].y + ankles[1].y) / 2;
    
    // Calculate knee angle
    const relativeKneePosition = (kneeY - hipY) / (ankleY - hipY);
    const isSquatting = relativeKneePosition > 0.65; // Threshold for squat position
    
    // Update squat state
    const now = Date.now();
    
    if (isSquatting !== squats.isDown) {
      // State changed
      const newSquatState = { 
        isDown: isSquatting,
        lastChangeTime: now,
        count: isSquatting ? squats.count : squats.count + 1 
      };
      
      // Calculate squat speed
      if (!isSquatting && squats.lastChangeTime > 0) {
        const cycleDuration = (now - squats.lastChangeTime) / 1000; // in seconds
        const squatsPerMinute = 60 / (cycleDuration * 2); // one full squat is down+up
        setSquatSpeed(Math.round(squatsPerMinute));
        
        // Call squat detected callback if this was the end of a squat
        if (newSquatState.count % 3 === 0 && onSquatDetected) {
          onSquatDetected();
        }
      }
      
      setSquats(newSquatState);
    }
  };

  return {
    isRunning,
    startDetection,
    stopDetection,
    squatCount: squats.count,
    squatSpeed,
    resetSquats,
    jointPoints
  };
};

<lov-add-dependency>@tensorflow-models/pose-detection@2.1.3</lov-add-dependency>
<lov-add-dependency>@tensorflow/tfjs-core@4.10.0</lov-add-dependency>
<lov-add-dependency>@tensorflow/tfjs-backend-webgl@4.10.0</lov-add-dependency>
