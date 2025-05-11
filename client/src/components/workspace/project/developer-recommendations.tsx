import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Progress from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDeveloperRecommendationsQueryFn } from "@/lib/api";
import { useParams } from "react-router-dom";

interface DeveloperRecommendationsProps {
    projectId?: string | null;
}

interface Developer {
    id: string;
    name: string;
    skills: string[];
    score: number;
    skillMatch: number;
    experience: number;
    performanceRating: number;
    currentWorkload: number;
}

interface RecommendationData {
    success: boolean;
    recommendations: Developer[];
    projectLanguages: string[];
}

const DeveloperRecommendations = ({ projectId }: DeveloperRecommendationsProps) => {
    const params = useParams();
    const currentProjectId = projectId || params.projectId;

    const { data, isLoading, error } = useQuery<RecommendationData>({
        queryKey: ["recommendations", currentProjectId],
        queryFn: () => getDeveloperRecommendationsQueryFn(currentProjectId!),
        enabled: !!currentProjectId,
    });

    useEffect(() => {
        if (data) {
            console.log("Received recommendations data:", data);
            console.log("Project languages:", data.projectLanguages);
        }
    }, [data]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-10">
                <Loader className="h-6 w-6 animate-spin mr-2" />
                <p>Loading recommendations...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-700">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 className="font-semibold">Error</h3>
                </div>
                <p className="mt-1">
                    Unable to load developer recommendations.
                </p>
            </div>
        );
    }

    if (!data.recommendations || data.recommendations.length === 0) {
        return (
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-700">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3 className="font-semibold">No Recommendations</h3>
                </div>
                <p className="mt-1">
                    No matching developers found for this project.
                    {data.projectLanguages && data.projectLanguages.length === 0 && (
                        <span className="block mt-1 text-sm">
                            No languages have been specified for this project.
                        </span>
                    )}
                </p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <polyline points="16 11 18 13 22 9"></polyline>
                    </svg>
                    Developer Recommendations
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.projectLanguages && data.projectLanguages.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">Required Languages:</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.projectLanguages.map((language: string, index: number) => (
                                <Badge key={index} variant="secondary">
                                    {language}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid gap-4 mt-4">
                    {data.recommendations.map((developer: Developer, index: number) => (
                        <Card key={index} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-medium text-lg">{developer.name}</h3>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {developer.skills?.map((skill: string, idx: number) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <Badge
                                        variant={developer.score > 70 ? "default" : developer.score > 40 ? "secondary" : "outline"}
                                        className="text-xs px-2 py-1"
                                    >
                                        Score: {developer.score}%
                                    </Badge>
                                </div>

                                <div className="grid gap-2 mt-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Skill Match</span>
                                        <span className="font-medium">{developer.skillMatch}%</span>
                                    </div>
                                    <Progress
                                        value={developer.skillMatch}
                                        className="h-2"
                                    />

                                    <div className="flex items-center justify-between text-sm mt-2">
                                        <span>Overall Score</span>
                                        <span className="font-medium">{developer.score}%</span>
                                    </div>
                                    <Progress
                                        value={developer.score}
                                        className="h-2"
                                    />

                                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Experience:</span>
                                            <span className="font-medium ml-2">{developer.experience} years</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Performance:</span>
                                            <span className="font-medium ml-2">{developer.performanceRating}/5</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default DeveloperRecommendations;
