import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PredictionHistoryItem {
  id: string;
  timestamp: string;
  priority: string;
  confidence: number;
  taskDescription: string;
}

interface TaskPredictionHistoryProps {
  taskId?: string;
}

export default function TaskPredictionHistory({ taskId }: TaskPredictionHistoryProps) {
  const [predictions, setPredictions] = useState<PredictionHistoryItem[]>([]);
  const [allPredictions, setAllPredictions] = useState<PredictionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'recent' | 'accurate' | 'similar'>('recent');
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Fetch initial predictions
  useEffect(() => {
    const fetchPredictionHistory = async () => {
      try {
        setIsLoading(true);
        // Updated to use new task-priority history endpoint
        const response = await fetch('http://localhost:3000/api/task-priority/history/5');
        
        if (!response.ok) {
          throw new Error('Failed to fetch prediction history');
        }
        
        const data = await response.json();
        setPredictions(data.predictions || []);
      } catch (err: any) {
        console.error('Error fetching priority prediction history:', err);
        setError(err.message || 'Failed to load prediction history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictionHistory();
  }, [taskId]);

  // Function to fetch all prediction history
  const fetchAllPredictionHistory = async () => {
    try {
      setIsLoadingAll(true);
      const response = await fetch('http://localhost:3000/api/task-priority/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch all prediction history');
      }
      
      const data = await response.json();
      setAllPredictions(data.predictions || []);
      setShowAllHistory(true);
    } catch (err: any) {
      console.error('Error fetching all prediction history:', err);
      setError(err.message || 'Failed to load all prediction history');
    } finally {
      setIsLoadingAll(false);
    }
  };

  // Get sorted predictions based on current view
  const getSortedPredictions = (predictionList: PredictionHistoryItem[]) => {
    if (predictionList.length === 0) return [];
    
    switch (view) {
      case 'recent':
        // Most recent first
        return [...predictionList].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      case 'accurate':
        // Highest confidence first
        return [...predictionList].sort((a, b) => b.confidence - a.confidence);
      case 'similar':
        // In a real app, this would use task similarity
        // For demo, we'll just return the original order
        return predictionList;
      default:
        return predictionList;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20 w-full">
        <Loader className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
        <span className="text-xs text-muted-foreground">Loading predictions...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-1 text-xs">{error}</div>;
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4 bg-muted/10 rounded-md text-sm border border-dashed">
        <Sparkles className="h-4 w-4 mx-auto mb-2 opacity-50" />
        <p>No priority predictions available yet</p>
        <p className="text-xs mt-1">Create tasks to see AI predictions</p>
      </div>
    );
  }

  const sortedPredictions = getSortedPredictions(predictions);
  const sortedAllPredictions = getSortedPredictions(allPredictions);

  return (
    <div className="space-y-2">
      <Tabs defaultValue="recent" className="w-full" onValueChange={(val) => setView(val as any)}>
        <TabsList className="grid grid-cols-3 h-7 text-xs">
          <TabsTrigger value="recent" className="px-2 py-0.5 flex items-center">
            <Loader className="h-3 w-3 mr-1" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="accurate" className="px-2 py-0.5 flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            Confident
          </TabsTrigger>
          <TabsTrigger value="similar" className="px-2 py-0.5 flex items-center">
            <X className="h-3 w-3 mr-1" />
            Similar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="mt-1 p-0">
          <ScrollArea className="h-[130px]">
            <div className="space-y-1 pr-1">
              {sortedPredictions.map((prediction) => (
                <PredictionItem prediction={prediction} key={prediction.id} />
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-center mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchAllPredictionHistory}
              disabled={isLoadingAll}
              className="text-xs flex items-center h-6 px-2 hover:bg-muted"
            >
              {isLoadingAll ? (
                <Loader className="h-3 w-3 mr-1 animate-spin" /> 
              ) : (
                <X className="h-3 w-3 mr-1" />
              )}
              View All History
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="accurate" className="mt-1 p-0">
          <ScrollArea className="h-[130px]">
            <div className="space-y-1 pr-1">
              {sortedPredictions.map((prediction) => (
                <PredictionItem prediction={prediction} key={prediction.id} />
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-center mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchAllPredictionHistory}
              disabled={isLoadingAll}
              className="text-xs flex items-center h-6 px-2 hover:bg-muted"
            >
              {isLoadingAll ? (
                <Loader className="h-3 w-3 mr-1 animate-spin" /> 
              ) : (
                <X className="h-3 w-3 mr-1" />
              )}
              View All History
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="similar" className="mt-1 p-0">
          <ScrollArea className="h-[130px]">
            <div className="space-y-1 pr-1">
              {sortedPredictions.map((prediction) => (
                <PredictionItem prediction={prediction} key={prediction.id} />
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-center mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchAllPredictionHistory}
              disabled={isLoadingAll}
              className="text-xs flex items-center h-6 px-2 hover:bg-muted"
            >
              {isLoadingAll ? (
                <Loader className="h-3 w-3 mr-1 animate-spin" /> 
              ) : (
                <X className="h-3 w-3 mr-1" />
              )}
              View All History
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog for showing all history */}
      <Dialog open={showAllHistory} onOpenChange={setShowAllHistory}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Prediction History</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isLoadingAll ? (
              <div className="flex items-center justify-center h-40">
                <Loader className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span>Loading all predictions...</span>
              </div>
            ) : (
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2 pr-2">
                  {sortedAllPredictions.map((prediction) => (
                    <div 
                      key={prediction.id}
                      className="flex flex-col p-2 border rounded-md bg-background"
                    >
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`font-medium ${getPriorityColor(prediction.priority)}`}
                        >
                          {prediction.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(prediction.timestamp).toLocaleString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Confidence:</span>
                          <span className="text-xs font-medium">{Math.round(prediction.confidence * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${Math.round(prediction.confidence * 100)}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted PredictionItem as a separate component for better organization
function PredictionItem({ prediction, expanded = false }: { prediction: PredictionHistoryItem; expanded?: boolean }) {
  const { color, icon } = getPriorityDetails(prediction.priority);
  const confidencePercent = Math.round(prediction.confidence * 100);
  
  // Function to get color based on confidence level
  const getConfidenceColor = (percent: number) => {
    if (percent >= 90) return "text-green-600";
    if (percent >= 70) return "text-blue-600";
    if (percent >= 50) return "text-amber-600";
    return "text-red-600";
  };
  
  return (
    <div 
      className={`flex items-start p-2 border rounded-md border-l-4 bg-background hover:bg-muted/20 transition-colors ${expanded ? 'mb-3' : ''}`}
      style={{ 
        borderLeftColor: color.includes('red') ? '#f87171' : 
                          color.includes('blue') ? '#60a5fa' : '#4ade80' 
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge 
                  variant="outline" 
                  className={`font-medium text-xs py-0 h-5 ${color}`}
                >
                  <span className="flex items-center whitespace-nowrap">
                    {icon}
                    {prediction.priority}
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="right" className="p-2">
                <p className="text-xs">AI suggested priority</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <span className="text-xs truncate ml-2 text-muted-foreground font-medium">
            {prediction.taskDescription}
          </span>
          
          <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
            {formatTimestamp(prediction.timestamp)}
          </span>
        </div>
        
        <div className="flex items-center mt-2">
          <div className="w-full">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Confidence: {confidencePercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className={`${getConfidenceColor(confidencePercent)} h-2 rounded-full`} 
                style={{width: `${confidencePercent}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get color and icon based on priority
function getPriorityDetails(priority: string) {
  switch (priority.toUpperCase()) {
    case 'HIGH':
      return { 
        color: 'bg-red-100 text-red-800 border-red-400',
        icon: <Sparkles className="h-3 w-3 mr-1 text-red-600" />
      };
    case 'MEDIUM':
      return { 
        color: 'bg-blue-100 text-blue-800 border-blue-400',
        icon: <Loader className="h-3 w-3 mr-1 text-blue-600" />
      };
    case 'LOW':
      return { 
        color: 'bg-green-100 text-green-800 border-green-400',
        icon: <X className="h-3 w-3 mr-1 text-green-600" />
      };
    default:
      return { 
        color: 'bg-gray-100 text-gray-800 border-gray-400',
        icon: <Loader className="h-3 w-3 mr-1 text-gray-600" />
      };
  }
}

// Function to format timestamp to be more compact
function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }
}

// Helper function to get color for priority badge
function getPriorityColor(priority: string) {
  switch (priority.toUpperCase()) {
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-400';
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-800 border-blue-400';
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-400';
  }
} 