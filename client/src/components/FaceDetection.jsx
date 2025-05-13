import { useRef, useEffect, useState } from 'react';
import { loadModels, detectFaces } from '../utils/faceApiConfig';
import * as faceapi from 'face-api.js';

const FaceDetection = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Load face-api models on component mount
  useEffect(() => {
    const loadFaceApiModels = async () => {
      try {
        await loadModels();
        setModelLoaded(true);
      } catch (err) {
        setError('Failed to load face-api models: ' + err.message);
        console.error(err);
      }
    };

    loadFaceApiModels();
    // Cleanup function
    return () => {
      // Stop video stream if active
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Start webcam when models are loaded
  useEffect(() => {
    if (!modelLoaded) return;
    
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Failed to access webcam: ' + err.message);
        console.error(err);
      }
    };
    
    startWebcam();
  }, [modelLoaded]);

  // Handle video play event
  const handleVideoPlay = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    // Set canvas dimensions to match video
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    
    // Start face detection
    detectFacesInVideo();
  };

  // Detect faces in video stream
  const detectFacesInVideo = async () => {
    if (!canvasRef.current || !videoRef.current || !modelLoaded) return;
    
    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    };
    
    // Match canvas dimensions with video
    faceapi.matchDimensions(canvasRef.current, displaySize);
    
    // Start detection loop
    const detectionInterval = setInterval(async () => {
      if (!videoRef.current || !videoRef.current.paused && !videoRef.current.ended) {
        try {
          // Detect faces
          const detections = await detectFaces(videoRef.current);
          
          // Clear previous drawings
          const context = canvasRef.current.getContext('2d');
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Resize detections to match display size
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          
          // Draw detection results
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
          
          // Draw age and gender
          resizedDetections.forEach(detection => {
            const { age, gender, genderProbability } = detection;
            const box = detection.detection.box;
            const text = [
              `Age: ${Math.round(age)} years`,
              `Gender: ${gender} (${Math.round(genderProbability * 100)}%)`
            ];
            const anchor = { x: box.x, y: box.bottom + 5 };
            const drawOptions = {
              anchorPosition: 'TOP_LEFT',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              fontColor: 'white',
              fontSize: 16
            };
            const drawBox = new faceapi.draw.DrawTextField(text, anchor, drawOptions);
            drawBox.draw(canvasRef.current);
          });
        } catch (err) {
          console.error('Face detection error:', err);
        }
      }
    }, 100);
    
    // Clean up interval on component unmount
    return () => clearInterval(detectionInterval);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto mt-8">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full rounded shadow-lg"
          autoPlay
          muted
          playsInline
          onPlay={handleVideoPlay}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-gray-700">
          {modelLoaded 
            ? 'Face models loaded. Detection active.' 
            : 'Loading face detection models...'}
        </p>
      </div>
    </div>
  );
};

export default FaceDetection; 