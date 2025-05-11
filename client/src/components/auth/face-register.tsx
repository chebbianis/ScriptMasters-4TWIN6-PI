import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader } from 'lucide-react';
import API from '@/lib/axios-client';
import { toast } from '@/hooks/use-toast';

// Types
type FaceRegisterProps = {
    userId: string;
    onSuccess: () => void;
    onCancel: () => void;
};

const FaceRegister: React.FC<FaceRegisterProps> = ({ userId, onSuccess, onCancel }) => {
    const webcamRef = useRef<Webcam>(null);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Charger les modèles face-api.js
    useEffect(() => {
        const loadModels = async () => {
            try {
                // S'assurer que l'URL pointe vers le bon dossier dans public
                const MODEL_URL = '/models';
                console.log("Loading models from:", MODEL_URL);

                // S'assurer que les modèles sont chargés une seule fois
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
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

    const captureAndUpload = async () => {
        if (!webcamRef.current || isCapturing || isUploading) return;

        setIsCapturing(true);

        try {
            // Capturer l'image
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                throw new Error("Failed to capture image");
            }

            // Vérifier qu'un visage est détecté
            const img = await faceapi.fetchImage(imageSrc);
            const detections = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions());

            if (!detections) {
                toast({
                    title: "No face detected",
                    description: "Please position yourself properly in front of the camera",
                    variant: "destructive",
                });
                setIsCapturing(false);
                return;
            }

            // Envoyer l'image au serveur
            setIsUploading(true);
            setIsCapturing(false);

            // Convertir l'image en Blob
            const response = await fetch(imageSrc);
            const blob = await response.blob();

            // Créer FormData pour l'envoi
            const formData = new FormData();
            formData.append('faceImage', blob, 'face.jpg');
            formData.append('userId', userId);

            // Envoyer au serveur en utilisant l'instance API configurée
            const uploadResponse = await API.post("user/register-face", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (uploadResponse.data.success) {
                toast({
                    title: "Face registered",
                    description: "Your face has been successfully registered for future authentication",
                });

                onSuccess();
            } else {
                toast({
                    title: "Registration error",
                    description: uploadResponse.data.message || "An error occurred while registering your face",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Face registration error:", error);
            toast({
                title: "Error",
                description: "An error occurred during facial registration",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            setIsCapturing(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle>Register your face</CardTitle>
                <CardDescription>
                    This registration will allow you to log in using facial recognition
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
                                    onClick={captureAndUpload}
                                    disabled={isModelLoading || isCapturing || isUploading}
                                    className="flex gap-2 items-center justify-center"
                                >
                                    {(isCapturing || isUploading) && <Loader className="h-4 w-4 animate-spin" />}
                                    {isCapturing ? "Capturing..." :
                                        isUploading ? "Registering..." : "Register my face"}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isCapturing || isUploading}
                                >
                                    Skip this step
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default FaceRegister; 