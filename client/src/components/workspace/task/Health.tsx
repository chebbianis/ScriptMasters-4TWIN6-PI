import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// Interfaces for API responses
interface Workspace {
  _id: string;
  name: string;
  description: string;
  owner: string;
  members: { userId: string; role: string; joinedAt: string; _id: string }[];
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspacesResponse {
  success: boolean;
  message: string;
  count: number;
  workspaces: Workspace[];
}

interface Project {
  projectId: string;
  name: string;
  emoji: string;
  metrics: {
    priorityPressure: string;
    progressMomentum: string;
    activity: string;
  };
  counts: {
    total: number;
    highPriority: number;
    inProgress: number;
    done: number;
  };
}

interface BottleneckResponse {
  workspaceId: string;
  totalTasks: number;
  totalHighPriority: number;
  projects: Project[];
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  project: {
    _id: string;
    name: string;
    emoji: string;
  };
}

interface TasksResponse {
  success: boolean;
  tasks: Task[];
}

const Health: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [bottleneckData, setBottleneckData] = useState<BottleneckResponse | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showExplanations, setShowExplanations] = useState<{ [key: string]: boolean }>({}); 

  // Fetch all workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/task/allworkspaces');
        const data: WorkspacesResponse = await response.json();
        if (data.success) {
          setWorkspaces(data.workspaces);
        } else {
          setError('Failed to fetch workspaces');
        }
      } catch (err) {
        setError('Error fetching workspaces');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  // Fetch bottleneck data and tasks when workspace is selected
  useEffect(() => {
    if (!selectedWorkspaceId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const bottleneckResponse = await fetch(`http://localhost:3000/task/${selectedWorkspaceId}/bottlenecks`);
        const bottleneckData: BottleneckResponse = await bottleneckResponse.json();
        setBottleneckData(bottleneckData);

        const tasksResponse = await fetch(`http://localhost:3000/task/all?workspaceId=${selectedWorkspaceId}`);
        const tasksData: TasksResponse = await tasksResponse.json();
        if (tasksData.success) {
          setTasks(tasksData.tasks);
        }
      } catch (err) {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedWorkspaceId]);

  // Handle workspace selection
  const handleWorkspaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWorkspaceId(event.target.value);
    setBottleneckData(null);
    setTasks([]);
    setShowExplanations({}); // Reset explanations
  };

  // Toggle explanation visibility
  const toggleExplanation = (chartId: string) => {
    setShowExplanations((prev) => ({
      ...prev,
      [chartId]: !prev[chartId],
    }));
  };

  // Get workspace name
  const getWorkspaceName = () => {
    const workspace = workspaces.find((w) => w._id === selectedWorkspaceId);
    return workspace ? workspace.name : selectedWorkspaceId;
  };

  // Bar chart data
  const prepareBarChartData = (project: Project) => ({
    labels: ['Priority Pressure', 'Progress Momentum', 'Activity'],
    datasets: [
      {
        label: `${project.name} Metrics`,
        data: [
          parseFloat(project.metrics.priorityPressure),
          parseFloat(project.metrics.progressMomentum),
          parseFloat(project.metrics.activity),
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  });

  const barChartOptions = {
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Percentage (%)' } },
    },
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Project Health Metrics' },
    },
  };

  // Line chart data
  const prepareLineChartData = () => {
    const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    return {
      labels: tasks.map((task) => new Date(task.dueDate).toLocaleDateString()),
      datasets: [
        {
          label: 'Task Priority',
          data: tasks.map((task) => priorityOrder[task.priority as keyof typeof priorityOrder] || 0),
          borderColor: '#4B5EAA',
          backgroundColor: 'rgba(75, 94, 170, 0.2)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const lineChartOptions = {
    scales: {
      x: { title: { display: true, text: 'Due Date' } },
      y: {
        title: { display: true, text: 'Priority' },
        ticks: { stepSize: 1, callback: (value: number) => ['Low', 'Medium', 'High'][value - 1] || '' },
        min: 1,
        max: 3,
      },
    },
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Task Priority Over Time' },
    },
  };

  // Calculate workspace-wide totals by summing all projects
  const totalTasks = bottleneckData?.projects?.reduce((sum, p) => sum + (p.counts.total || 0), 0) || 0;
  const totalHighPriority = bottleneckData?.projects?.reduce((sum, p) => sum + (p.counts.highPriority || 0), 0) || 0;
  const totalInProgress = bottleneckData?.projects?.reduce((sum, p) => sum + (p.counts.inProgress || 0), 0) || 0;
  const totalDone = bottleneckData?.projects?.reduce((sum, p) => sum + (p.counts.done || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Modern Dropdown */}
      <div className="relative">
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <select
          value={selectedWorkspaceId}
          onChange={handleWorkspaceChange}
          disabled={loading || workspaces.length === 0}
          className="w-full max-w-md appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-400 cursor-pointer"
        >
          <option value="" className="text-gray-500">Select a Workspace</option>
          {workspaces.map((workspace) => (
            <option key={workspace._id} value={workspace._id} className="text-gray-700">
              {workspace.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      {/* Workspace Summary and Counts */}
      {bottleneckData && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800">Workspace: {getWorkspaceName()}</h3>
          <p className="text-gray-600">Total Tasks: {bottleneckData.totalTasks} | High Priority: {bottleneckData.totalHighPriority}</p>

          {bottleneckData.projects.map((project) => (
            <div key={project.projectId} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <h4 className="text-lg font-bold">Total Tasks</h4>
                  <p className="text-2xl">{project.counts.total}</p>
                </div>
                <div className="bg-gradient-to-br from-red-400 to-red-600 text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <h4 className="text-lg font-bold">High Priority</h4>
                  <p className="text-2xl">{project.counts.highPriority}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <h4 className="text-lg font-bold">In Progress</h4>
                  <p className="text-2xl">{project.counts.inProgress}</p>
                </div>
                <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                  <h4 className="text-lg font-bold">Done</h4>
                  <p className="text-2xl">{project.counts.done}</p>
                </div>
              </div>

              {/* Bar Chart with Explanation */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <Bar data={prepareBarChartData(project)} options={barChartOptions} />
                <button
                  onClick={() => toggleExplanation(`bar-${project.projectId}`)}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                >
                  {showExplanations[`bar-${project.projectId}`] ? 'Hide Explanation' : 'Show Explanation'}
                </button>
                {showExplanations[`bar-${project.projectId}`] && (
                  <p className="mt-2 text-gray-600 text-sm">
                    This chart shows project health metrics:
                    <ul className="list-disc pl-4">
                      <li><strong>Priority Pressure</strong>: {project.metrics.priorityPressure} of tasks are high-priority.</li>
                      <li><strong>Progress Momentum</strong>: {project.metrics.progressMomentum} of tasks are in progress or done.</li>
                      <li><strong>Activity</strong>: {project.metrics.activity} of remaining tasks are completed.</li>
                    </ul>
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Line Chart with Explanation */}
          {tasks.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <Line data={prepareLineChartData()} options={lineChartOptions} />
              <button
                onClick={() => toggleExplanation('line')}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
              >
                {showExplanations['line'] ? 'Hide Explanation' : 'Show Explanation'}
              </button>
              {showExplanations['line'] && (
                <p className="mt-2 text-gray-600 text-sm">
                  This chart tracks task priority over time:
                  <ul className="list-disc pl-4">
                    <li><strong>X-Axis</strong>: Due dates of tasks.</li>
                    <li><strong>Y-Axis</strong>: Priority levels (Low=1, Medium=2, High=3).</li>
                    <li><strong>Trend</strong>: Shows how priority changes as deadlines approach.</li>
                  </ul>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Health;