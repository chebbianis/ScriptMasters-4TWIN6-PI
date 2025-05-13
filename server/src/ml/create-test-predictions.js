// Script to create test priority predictions
const axios = require('axios');

async function createSamplePredictions() {
  const priorities = ['HIGH', 'MEDIUM', 'LOW'];
  const descriptions = [
    'Implement user authentication',
    'Fix UI bug in dashboard',
    'Update API documentation',
    'Create new landing page',
    'Optimize database queries'
  ];
  
  for (let i = 0; i < 5; i++) {
    const features = {
      descriptionLength: Math.floor(Math.random() * 300),
      hasDueDate: true,
      daysUntilDue: Math.floor(Math.random() * 10),
      assignedToWorkload: Math.floor(Math.random() * 5),
      projectProgress: Math.random(),
      taskDependencies: Math.floor(Math.random() * 4),
      description: descriptions[i % descriptions.length]
    };
    
    try {
      console.log(`Creating prediction ${i+1}...`);
      const response = await axios.post('http://localhost:3000/api/task-priority', features);
      console.log(`Prediction ${i+1} created:`, response.data);
    } catch (error) {
      console.error(`Error creating prediction ${i+1}:`, error.message);
    }
  }
  
  console.log('Done creating sample predictions');
}

// Call the function to create sample predictions
createSamplePredictions(); 