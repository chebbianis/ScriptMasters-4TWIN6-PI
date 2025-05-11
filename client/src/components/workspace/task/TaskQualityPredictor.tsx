import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const defaultForm = {
  Category: '',
  Action: '',
  Priority: '',
  EstimatedTime: '',
  ActualTime: '',
  CompletionPercentage: '',
  TimeSpent: '',
  Status: '',
};

const categories = ['Work', 'Learning'];
const actions = [
  'Review code changes',
  'Fix errors in code',
  'Write technical document',
  'Learn new skills',
  'Plan upcoming sprint',
  'Discuss project progress',
  'Refactor existing code',
  'Network with peers',
  'Learn new programming language',
  'Submit a functioning solution',
  'Code collaboratively',
];
const priorities = ['High', 'Medium', 'Low'];
const statuses = ['Under', 'Over'];

const TaskQualityPredictor: React.FC = () => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ prediction: string; confidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    // Validate and fix decimal input
    const fixedForm = { ...form };
    ['EstimatedTime', 'ActualTime', 'CompletionPercentage', 'TimeSpent'].forEach((key) => {
      // @ts-ignore
      if (typeof fixedForm[key] === 'string') {
        // @ts-ignore
        fixedForm[key] = fixedForm[key].replace(',', '.');
      }
    });
    // Check for invalid decimal input
    if (fixedForm.CompletionPercentage && !/^\d*(\.\d+)?$/.test(fixedForm.CompletionPercentage)) {
      setError('Please use a dot (.) for decimals, e.g., 0.3');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fixedForm,
          EstimatedTime: Number(fixedForm.EstimatedTime),
          ActualTime: Number(fixedForm.ActualTime),
          CompletionPercentage: Number(fixedForm.CompletionPercentage),
          TimeSpent: Number(fixedForm.TimeSpent),
        }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned invalid JSON.');
      }
      if (data.error) throw new Error(data.error);
      setResult({ prediction: data.prediction, confidence: data.confidence });
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-2 text-center">Task Quality Predictor</h2>
      <p className="mb-4 text-center text-muted-foreground">Predict the quality of your task with confidence</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block font-medium mb-1">Category</label>
          <select name="Category" value={form.Category} onChange={handleChange} className="w-full border rounded px-2 py-1">
            <option value="">Select Category</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Action</label>
          <select name="Action" value={form.Action} onChange={handleChange} className="w-full border rounded px-2 py-1">
            <option value="">Select Action</option>
            {actions.map((act) => <option key={act} value={act}>{act}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Priority</label>
          <select name="Priority" value={form.Priority} onChange={handleChange} className="w-full border rounded px-2 py-1">
            <option value="">Select Priority</option>
            {priorities.map((pri) => <option key={pri} value={pri}>{pri}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Estimated Time (mins)</label>
          <Input name="EstimatedTime" type="number" min="0" value={form.EstimatedTime} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Actual Time (mins)</label>
          <Input name="ActualTime" type="number" min="0" value={form.ActualTime} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Completion Percentage (0-1)</label>
          <Input name="CompletionPercentage" type="number" min="0" max="1" step="0.01" value={form.CompletionPercentage} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Time Spent (mins)</label>
          <Input name="TimeSpent" type="number" min="0" value={form.TimeSpent} onChange={handleChange} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Status</label>
          <select name="Status" value={form.Status} onChange={handleChange} className="w-full border rounded px-2 py-1">
            <option value="">Select Status</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? 'Predicting...' : 'Predict Quality'}
        </Button>
      </form>
      {loading && <div className="text-center mt-4">Making prediction...</div>}
      {result && (
        <div className="mt-4 p-4 rounded bg-muted/50 border-l-4 border-indigo-500">
          <h4 className="font-bold text-indigo-700 mb-2">Prediction Result</h4>
          <p className="mb-1"><strong>Quality:</strong> {result.prediction}</p>
          <p className="mb-0"><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  );
};

export default TaskQualityPredictor; 