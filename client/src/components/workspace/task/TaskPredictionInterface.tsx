import { FC, useEffect, useState } from 'react';
import { useTaskPriorityPrediction } from '@/hooks/use-task-priority-prediction';
import { TaskPriorityEnum } from '@/constant';
import { Loader, Sparkles, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Progress from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TaskPredictionInterfaceProps {
  taskId?: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
  assignedTo?: string;
}

interface PredictionHistory {
  predictedPriority: string;
  confidence: number;
  features: {
    descriptionLength: number;
    hasDueDate: boolean;
    daysUntilDue: number;
    assignedToWorkload: number;
    projectProgress: number;
    taskDependencies: number;
  };
  createdAt: string;
}

const TaskPredictionInterface: FC<TaskPredictionInterfaceProps> = ({
  taskId,
  description,
  dueDate,
  projectId,
  assignedTo,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory[]>([]);
  const { mutate: predictPriority, isPending: isPredicting } = useTaskPriorityPrediction();
  const [currentPrediction, setCurrentPrediction] = useState<{
    priority: string;
    confidence: number;
    features: any;
  } | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case TaskPriorityEnum.HIGH:
        return 'bg-red-100 text-red-800';
      case TaskPriorityEnum.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TaskPriorityEnum.LOW:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const predictTaskPriority = async () => {
    if (!description || !projectId) return;

    const daysUntilDue = dueDate 
      ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const features = {
      descriptionLength: description.length,
      hasDueDate: !!dueDate,
      daysUntilDue,
      assignedToWorkload: 1,
      projectProgress: 0.5,
      taskDependencies: 0,
    };

    predictPriority(features, {
      onSuccess: (data) => {
        if (data.status === 'success') {
          setCurrentPrediction({
            priority: data.priority,
            confidence: data.confidence,
            features,
          });
          // Add to history
          setPredictionHistory(prev => [{
            predictedPriority: data.priority,
            confidence: data.confidence,
            features,
            createdAt: new Date().toISOString(),
          }, ...prev]);
        }
      },
    });
  };

  useEffect(() => {
    if (description && projectId) {
      predictTaskPriority();
    }
  }, [description, projectId, dueDate]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Task Priority Prediction
          </CardTitle>
          <CardDescription>
            Our AI analyzes your task details to suggest the most appropriate priority level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPredicting ? (
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              <span>Analyzing task...</span>
            </div>
          ) : currentPrediction ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Predicted Priority</p>
                  <Badge className={getPriorityColor(currentPrediction.priority)}>
                    {currentPrediction.priority}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Confidence</p>
                  <p className="text-sm">{Math.round(currentPrediction.confidence * 100)}%</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Confidence Level</p>
                <Progress value={currentPrediction.confidence * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Features Used</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Description Length</p>
                    <p>{currentPrediction.features.descriptionLength} characters</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Due Date</p>
                    <p>{currentPrediction.features.hasDueDate ? 'Set' : 'Not Set'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Days Until Due</p>
                    <p>{currentPrediction.features.daysUntilDue} days</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Project Progress</p>
                    <p>{Math.round(currentPrediction.features.projectProgress * 100)}%</p>
                  </div>
                </div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <BellOff className="h-4 w-4 mr-2" />
                    View Prediction History
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Prediction History</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {predictionHistory.map((prediction, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getPriorityColor(prediction.predictedPriority)}>
                              {prediction.predictedPriority}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(prediction.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <Progress value={prediction.confidence * 100} className="h-2 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Confidence: {Math.round(prediction.confidence * 100)}%
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter task details to get a priority prediction
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskPredictionInterface; 