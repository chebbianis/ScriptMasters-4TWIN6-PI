import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Mock MongoDB connection
jest.mock('../src/config/database', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
}));

// Mock any other external services or configurations here