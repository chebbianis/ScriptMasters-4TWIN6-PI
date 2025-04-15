import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { TaskTable } from '../../../../components/workspace/task/task-table';
import { Task } from '../../../../types/task';

describe('TaskTable Component', () => {
    const mockTasks: Task[] = [
        {
            _id: '1',
            title: 'Test Task 1',
            description: 'Test Description 1',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            project: {
                name: 'Test Project',
                emoji: '🚀'
            }
        },
        {
            _id: '2',
            title: 'Test Task 2',
            description: 'Test Description 2',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            reminder: true,
            project: {
                name: 'Test Project',
                emoji: '🚀'
            }
        }
    ];

    const mockOnTaskUpdate = vi.fn();
    const mockOnTaskDelete = vi.fn();
    const mockOnClearReminder = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders task table with correct columns', () => {
        render(
            <TaskTable
                tasks={mockTasks}
                onTaskUpdate={mockOnTaskUpdate}
                onTaskDelete={mockOnTaskDelete}
                onClearReminder={mockOnClearReminder}
            />
        );

        expect(screen.getByText('Tâche')).toBeInTheDocument();
        expect(screen.getByText('Projet')).toBeInTheDocument();
        expect(screen.getByText('Statut')).toBeInTheDocument();
        expect(screen.getByText('Priorité')).toBeInTheDocument();
        expect(screen.getByText('Date d\'échéance')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays tasks with correct styling based on due date', () => {
        render(
            <TaskTable
                tasks={mockTasks}
                onTaskUpdate={mockOnTaskUpdate}
                onTaskDelete={mockOnTaskDelete}
                onClearReminder={mockOnClearReminder}
            />
        );

        // Task 1 should have orange background (due tomorrow)
        const task1Row = screen.getByText('Test Task 1').closest('tr');
        expect(task1Row).toHaveClass('bg-orange-50');

        // Task 2 should have red background (overdue with reminder)
        const task2Row = screen.getByText('Test Task 2').closest('tr');
        expect(task2Row).toHaveClass('bg-red-50');
    });

    it('calls onClearReminder when clicking the bell icon', () => {
        render(
            <TaskTable
                tasks={mockTasks}
                onTaskUpdate={mockOnTaskUpdate}
                onTaskDelete={mockOnTaskDelete}
                onClearReminder={mockOnClearReminder}
            />
        );

        const bellIcon = screen.getByTestId('clear-reminder-2');
        fireEvent.click(bellIcon);

        expect(mockOnClearReminder).toHaveBeenCalledWith('2');
    });

    it('calls onTaskDelete when clicking the delete button', () => {
        render(
            <TaskTable
                tasks={mockTasks}
                onTaskUpdate={mockOnTaskUpdate}
                onTaskDelete={mockOnTaskDelete}
                onClearReminder={mockOnClearReminder}
            />
        );

        const deleteButton = screen.getByText('Test Task 1').closest('tr')?.querySelector('button[class*="text-red-600"]');
        if (deleteButton) {
            fireEvent.click(deleteButton);
            expect(mockOnTaskDelete).toHaveBeenCalledWith('1');
        }
    });
}); 