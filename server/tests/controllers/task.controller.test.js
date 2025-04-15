const mongoose = require('mongoose');
const { createTask } = require('../../src/controllers/task.controller');

// Mock mongoose
jest.mock('mongoose', () => ({
    ...jest.requireActual('mongoose'),
    model: jest.fn().mockImplementation((name) => {
        if (name === 'Task') {
            return {
                create: jest.fn(),
                findById: jest.fn(),
                findOne: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnThis(),
                    select: jest.fn().mockReturnThis(),
                    exec: jest.fn().mockResolvedValue(null)
                }),
                exists: jest.fn().mockResolvedValue(false),
                find: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnThis(),
                    sort: jest.fn().mockReturnThis(),
                    skip: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockReturnThis(),
                    exec: jest.fn()
                }),
                TaskStatus: {
                    TODO: 'TODO',
                    IN_PROGRESS: 'IN_PROGRESS',
                    DONE: 'DONE'
                },
                TaskPriority: {
                    LOW: 'LOW',
                    MEDIUM: 'MEDIUM',
                    HIGH: 'HIGH'
                }
            };
        }
        if (name === 'Project') {
            return {
                findById: jest.fn()
            };
        }
        if (name === 'User') {
            return {
                findById: jest.fn()
            };
        }
    })
}));

// Mock the models
jest.mock('../../src/models/project.model', () => ({}));
jest.mock('../../src/models/task.model', () => ({}));
jest.mock('../../src/models/user.model', () => ({}));

describe('Task Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            body: {},
            params: {},
            query: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Reset the mongoose model mocks
        mongoose.model.mockClear();
    });

    describe('createTask', () => {
        it('should return 400 if title is missing', async () => {
            const mockReq = {
                body: {
                    projectId: 'project123'
                }
            };

            await createTask(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Title is required'
            });
        });

        it('should return 400 if projectId is missing', async () => {
            const mockReq = {
                body: {
                    title: 'Test Task'
                }
            };

            await createTask(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Project ID is required'
            });
        });

        it('should return 404 if project not found', async () => {
            const mockReq = {
                body: {
                    title: 'Test Task',
                    projectId: 'nonexistent'
                }
            };

            // Mock Project.findById to return null
            mongoose.model('Project').findById.mockResolvedValueOnce(null);

            await createTask(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Project not found'
            });
        });
    });
});
