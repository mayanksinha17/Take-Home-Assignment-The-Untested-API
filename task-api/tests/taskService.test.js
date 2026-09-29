const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    test('creates a task with required defaults and unique id', () => {
      const task = taskService.create({ title: 'Test Task' });
      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(typeof task.createdAt).toBe('string');
    });

    test('creates a task with custom fields', () => {
      const dueDate = new Date().toISOString();
      const task = taskService.create({
        title: 'Custom Task',
        description: 'Detailed description',
        status: 'in_progress',
        priority: 'high',
        dueDate,
      });

      expect(task.title).toBe('Custom Task');
      expect(task.description).toBe('Detailed description');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(dueDate);
    });
  });

  describe('getAll', () => {
    test('returns an empty array when no tasks exist', () => {
      expect(taskService.getAll()).toEqual([]);
    });

    test('returns all created tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      const all = taskService.getAll();
      expect(all.length).toBe(2);
      expect(all[0].title).toBe('Task 1');
      expect(all[1].title).toBe('Task 2');
    });

    test('returns a copy of tasks array so internal array is not mutated directly', () => {
      taskService.create({ title: 'Task 1' });
      const list = taskService.getAll();
      list.pop();
      expect(taskService.getAll().length).toBe(1);
    });
  });

  describe('findById', () => {
    test('finds task by its id', () => {
      const created = taskService.create({ title: 'Find Me' });
      const found = taskService.findById(created.id);
      expect(found).toEqual(created);
    });

    test('returns undefined for non-existent id', () => {
      const found = taskService.findById('non-existent-uuid');
      expect(found).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    test('filters tasks matching status', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'in_progress' });
      taskService.create({ title: 'Task 3', status: 'done' });

      const todoTasks = taskService.getByStatus('todo');
      expect(todoTasks.length).toBe(1);
      expect(todoTasks[0].title).toBe('Task 1');

      const inProgressTasks = taskService.getByStatus('in_progress');
      expect(inProgressTasks.length).toBe(1);
      expect(inProgressTasks[0].title).toBe('Task 2');
    });

    test('returns empty array when no tasks match status', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      expect(taskService.getByStatus('done')).toEqual([]);
    });
  });

  describe('getPaginated', () => {
    test('returns first page of tasks for page=1', () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const page1 = taskService.getPaginated(1, 2);
      expect(page1.length).toBe(2);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[1].title).toBe('Task 2');

      const page2 = taskService.getPaginated(2, 2);
      expect(page2.length).toBe(2);
      expect(page2[0].title).toBe('Task 3');
      expect(page2[1].title).toBe('Task 4');

      const page3 = taskService.getPaginated(3, 2);
      expect(page3.length).toBe(1);
      expect(page3[0].title).toBe('Task 5');
    });

    test('returns empty array when page exceeds total tasks', () => {
      taskService.create({ title: 'Task 1' });
      const result = taskService.getPaginated(5, 10);
      expect(result).toEqual([]);
    });

    test('uses default parameters when none provided', () => {
      taskService.create({ title: 'Task 1' });
      const result = taskService.getPaginated();
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Task 1');
    });

  });

  describe('getStats', () => {
    test('returns zero counts for empty tasks list', () => {
      const stats = taskService.getStats();
      expect(stats).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0,
      });
    });

    test('correctly counts task statuses and overdue tasks', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Overdue: todo with past dueDate
      taskService.create({ title: 'T1', status: 'todo', dueDate: pastDate });
      // Overdue: in_progress with past dueDate
      taskService.create({ title: 'T2', status: 'in_progress', dueDate: pastDate });
      // Not overdue: done with past dueDate
      taskService.create({ title: 'T3', status: 'done', dueDate: pastDate });
      // Not overdue: future dueDate
      taskService.create({ title: 'T4', status: 'todo', dueDate: futureDate });
      // Not overdue: no dueDate
      taskService.create({ title: 'T5', status: 'done' });

      const stats = taskService.getStats();
      expect(stats).toEqual({
        todo: 2,
        in_progress: 1,
        done: 2,
        overdue: 2,
      });
    });
  });

  describe('update', () => {
    test('updates specified fields on existing task', () => {
      const created = taskService.create({ title: 'Original Title', priority: 'low' });
      const updated = taskService.update(created.id, { title: 'Updated Title', priority: 'high' });

      expect(updated).toBeDefined();
      expect(updated.title).toBe('Updated Title');
      expect(updated.priority).toBe('high');
      expect(updated.status).toBe('todo'); // unchanged
    });

    test('returns null when updating non-existent task', () => {
      const result = taskService.update('non-existent-id', { title: 'New' });
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    test('deletes existing task and returns true', () => {
      const created = taskService.create({ title: 'To Delete' });
      const deleted = taskService.remove(created.id);
      expect(deleted).toBe(true);
      expect(taskService.findById(created.id)).toBeUndefined();
    });

    test('returns false when deleting non-existent task', () => {
      const deleted = taskService.remove('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('completeTask', () => {
    test('marks task done, sets completedAt, and preserves original priority', () => {
      const highPriorityTask = taskService.create({ title: 'High Priority Task', priority: 'high' });
      const completed = taskService.completeTask(highPriorityTask.id);

      expect(completed).toBeDefined();
      expect(completed.status).toBe('done');
      expect(completed.completedAt).toBeDefined();
      expect(new Date(completed.completedAt).toString()).not.toBe('Invalid Date');
      // Regression check: priority MUST be preserved, not overwritten to medium
      expect(completed.priority).toBe('high');
    });

    test('marks low priority task done and preserves low priority', () => {
      const lowPriorityTask = taskService.create({ title: 'Low Priority Task', priority: 'low' });
      const completed = taskService.completeTask(lowPriorityTask.id);

      expect(completed.priority).toBe('low');
      expect(completed.status).toBe('done');
    });

    test('returns null when completing non-existent task', () => {
      const result = taskService.completeTask('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('assignTask', () => {
    test('assigns an assignee to an existing task and preserves other fields', () => {
      const created = taskService.create({ title: 'Task to Assign', priority: 'high' });
      const assigned = taskService.assignTask(created.id, 'John Doe');

      expect(assigned).toBeDefined();
      expect(assigned.id).toBe(created.id);
      expect(assigned.assignee).toBe('John Doe');
      expect(assigned.title).toBe('Task to Assign');
      expect(assigned.priority).toBe('high');

      const found = taskService.findById(created.id);
      expect(found.assignee).toBe('John Doe');
    });

    test('returns null when assigning non-existent task', () => {
      const result = taskService.assignTask('non-existent-id', 'John Doe');
      expect(result).toBeNull();
    });
  });
});
