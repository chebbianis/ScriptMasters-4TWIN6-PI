import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader } from 'lucide-react';
import API from '@/lib/axios-client';
import { useAuthContext } from '@/context/auth-provider';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// Types
type FaceAuthProps = {
    email: string;
    onCancel: () => void;
};

const FaceAuth: React.FC<FaceAuthProps> = ({ email, onCancel }) => {
    const webcamRef = useRef<Webcam>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const { login } = useAuthContext();
    const navigate = useNavigate();

    // Load face-api.js models
    useEffect(() => {
        const loadModels = async () => {
            try {
                // Ensure the URL points to the correct folder in public
                const MODEL_URL = '/models';
                console.log("Loading models from:", MODEL_URL);

                // Ensure models are loaded only once
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);

                console.log("Models loaded successfully");
                setIsModelLoading(false);
            } catch (error) {
                console.error("Error loading models:", error);
                toast({
                    title: "Error",
                    description: "Unable to load facial recognition models",
                    variant: "destructive",
                });
            }
        };

        loadModels();
    }, []);

    const captureAndVerify = async () => {
        if (!webcamRef.current || isCapturing || isVerifying) return;

        setIsCapturing(true);

        try {
            // Capture the image
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                throw new Error("Failed to capture image");
            }

            // Verify that a face is detected
            const img = await faceapi.fetchImage(imageSrc);
            const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detections) {
                toast({
                    title: "No face detected",
                    description: "Please position yourself properly in front of the camera",
                    variant: "destructive",
                });
                setIsCapturing(false);
                return;
            }

            // Send the image to the server for authentication
            setIsVerifying(true);
            setIsCapturing(false);

            try {
                // Convert image to Blob - the data URL needs to be processed correctly
                const base64Data = imageSrc.split(',')[1];
                const blob = await (await fetch(imageSrc)).blob();

                // Create FormData for sending - ensure email is correctly formatted
                const formData = new FormData();
                formData.append('faceImage', blob, 'face.jpg');
                formData.append('email', email);

                console.log("Sending authentication request with email:", email);

                // Send to server using the configured API instance
                // Make sure to NOT set Content-Type manually as FormData will set it with boundary
                const verifyResponse = await API.post("/user/verify-face", formData, {
                    headers: {
                        // Let the browser set the content type with boundary for multipart/form-data
                        'Content-Type': 'multipart/form-data',
                    }
                });

                console.log("Verification response:", verifyResponse.data);

                if (verifyResponse.data.success) {
                    // Authentication successful, log in the user
                    const userData = verifyResponse.data.user;

                    login({
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        isActive: userData.isActive,
                        lastLogin: userData.lastLogin,
                        WorkspaceId: userData.WorkspaceId,
                        accessToken: userData.accessToken,
                        refreshToken: userData.refreshToken
                    });

                    toast({
                        title: "Authentication successful",
                        description: "Welcome!",
                    });

                    // Redirect
                    const redirectPath = userData.WorkspaceId
                        ? `/workspace/${userData.WorkspaceId}`
                        : '/create-workspace';

                    navigate(redirectPath);
                } else {
                    // Authentication failed
                    toast({
                        title: "Authentication failed",
                        description: verifyResponse.data.message || "Face not recognized. Please try again or use password.",
                        variant: "destructive",
                    });
                }
            } catch (error: any) {
                console.error("Facial authentication error:", error);
                const errorMessage = error.response?.data?.message || "An error occurred during facial verification";
                toast({
                    title: "Authentication Error",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Facial processing error:", error);
            toast({
                title: "Error",
                description: "An error occurred during facial verification",
                variant: "destructive",
            });
        } finally {
            setIsVerifying(false);
            setIsCapturing(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle>Facial Authentication</CardTitle>
                <CardDescription>
                    Position your face in front of the camera
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    {isModelLoading ? (
                        <div className="flex flex-col items-center justify-center p-8">
                            <Loader className="h-8 w-8 animate-spin mb-4" />
                            <p>Loading facial recognition models...</p>
                        </div>
                    ) : (
                        <>
                            <div className="webcam-container border border-border rounded-md overflow-hidden">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{
                                        facingMode: "user",
                                        width: { ideal: 640 },
                                        height: { ideal: 480 }
                                    }}
                                    className="w-full h-auto"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    onClick={captureAndVerify}
                                    disabled={isModelLoading || isCapturing || isVerifying}
                                    className="flex gap-2 items-center justify-center"
                                >
                                    {(isCapturing || isVerifying) && <Loader className="h-4 w-4 animate-spin" />}
                                    {isCapturing ? "Capturing..." :
                                        isVerifying ? "Verifying..." : "Authenticate with face"}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isCapturing || isVerifying}
                                >
                                    Back to password login
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default FaceAuth; 