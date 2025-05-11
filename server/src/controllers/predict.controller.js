import axios from 'axios';
import { Project } from '../models/project.model.js';

// Controller function to fetch projects, make prediction, and return the results
export const predictProjects = async (req, res) => {
  try {
    // Fetch the data from the MongoDB 'projects' collection
    const projects = await Project.find({});

    if (!projects || projects.length === 0) {
      return res.status(400).json({ error: 'No projects found in the database' });
    }

    // Make a GET request to the Flask API to get predictions
    const response = await axios.get('http://localhost:5000/predict');

    // Get prediction result from Flask API response
    const predictions = response.data.predictions;

    // Combine predictions with their corresponding projects
    const predictionResults = projects.map((project, index) => ({
      projectId: project._id,
      projectName: project.name,
      prediction: predictions[index].prediction,  // Access prediction field correctly
    }));

    // Send back the predictions
    res.json({ predictions: predictionResults });

  } catch (error) {
    console.error('Error during prediction:', error.message);
    res.status(500).json({ error: 'Error making prediction' });
  }
};
