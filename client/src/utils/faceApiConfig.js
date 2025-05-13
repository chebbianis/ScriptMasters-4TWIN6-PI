import * as faceapi from 'face-api.js';

/**
 * Initialize and load all the face-api.js models
 * @returns {Promise<void>} A promise that resolves when all models are loaded
 */
export const loadModels = async () => {
  try {
    // Set the models path
    const MODEL_URL = '/models/';
    
    // Load face detection models
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    
    // Load face landmark model
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    
    // Load face recognition model
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    
    // Load face expression model
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    
    // Load age and gender model
    await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
    
    console.log('All face-api.js models loaded successfully!');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    throw error;
  }
};

/**
 * Detect faces in an image
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} media - The media element
 * @param {Object} options - Detection options
 * @returns {Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[]>}
 */
export const detectFaces = async (media, options = {}) => {
  const detectionOptions = new faceapi.SsdMobilenetv1Options({ 
    minConfidence: 0.5,
    ...options 
  });
  
  return faceapi.detectAllFaces(media, detectionOptions)
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withFaceExpressions()
    .withAgeAndGender();
};

/**
 * Create a face matcher for face recognition
 * @param {Array} labeledFaceDescriptors - Array of labeled face descriptors
 * @param {number} distanceThreshold - Threshold for face matching (default: 0.6)
 * @returns {faceapi.FaceMatcher} Face matcher instance
 */
export const createFaceMatcher = (labeledFaceDescriptors, distanceThreshold = 0.6) => {
  return new faceapi.FaceMatcher(labeledFaceDescriptors, distanceThreshold);
};

/**
 * Create a labeled face descriptor
 * @param {string} label - Label for the face
 * @param {Float32Array[]} descriptors - Array of face descriptors
 * @returns {faceapi.LabeledFaceDescriptors} Labeled face descriptor
 */
export const createLabeledFaceDescriptor = (label, descriptors) => {
  return new faceapi.LabeledFaceDescriptors(label, descriptors);
};

export default {
  loadModels,
  detectFaces,
  createFaceMatcher,
  createLabeledFaceDescriptor,
  faceapi
}; 