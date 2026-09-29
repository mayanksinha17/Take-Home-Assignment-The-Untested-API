const { validateCreateTask, validateUpdateTask, validateAssignTask } = require('../src/utils/validators');

describe('Validators', () => {
  describe('validateCreateTask', () => {
    test('returns null for valid minimal body', () => {
      const error = validateCreateTask({ title: 'Valid Task' });
      expect(error).toBeNull();
    });

    test('returns null for valid full body', () => {
      const error = validateCreateTask({
        title: 'Full Task',
        description: 'Task description',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date().toISOString(),
      });
      expect(error).toBeNull();
    });

    test('rejects missing or non-string or whitespace title', () => {
      expect(validateCreateTask({})).toMatch(/title is required/i);
      expect(validateCreateTask({ title: '' })).toMatch(/title is required/i);
      expect(validateCreateTask({ title: '   ' })).toMatch(/title is required/i);
      expect(validateCreateTask({ title: 123 })).toMatch(/title is required/i);
      expect(validateCreateTask({ title: null })).toMatch(/title is required/i);
    });

    test('rejects invalid status', () => {
      const error = validateCreateTask({ title: 'Task', status: 'invalid_status' });
      expect(error).toMatch(/status must be one of: todo, in_progress, done/i);
    });

    test('rejects invalid priority', () => {
      const error = validateCreateTask({ title: 'Task', priority: 'urgent' });
      expect(error).toMatch(/priority must be one of: low, medium, high/i);
    });

    test('rejects invalid dueDate', () => {
      const error = validateCreateTask({ title: 'Task', dueDate: 'not-a-date' });
      expect(error).toMatch(/dueDate must be a valid ISO date string/i);
    });
  });

  describe('validateUpdateTask', () => {
    test('returns null for empty update body', () => {
      const error = validateUpdateTask({});
      expect(error).toBeNull();
    });

    test('returns null for valid partial updates', () => {
      expect(validateUpdateTask({ title: 'New Title' })).toBeNull();
      expect(validateUpdateTask({ status: 'done' })).toBeNull();
      expect(validateUpdateTask({ priority: 'low' })).toBeNull();
      expect(validateUpdateTask({ dueDate: new Date().toISOString() })).toBeNull();
    });

    test('rejects invalid title in update', () => {
      expect(validateUpdateTask({ title: '' })).toMatch(/title must be a non-empty string/i);
      expect(validateUpdateTask({ title: '   ' })).toMatch(/title must be a non-empty string/i);
      expect(validateUpdateTask({ title: 123 })).toMatch(/title must be a non-empty string/i);
    });

    test('rejects invalid status in update', () => {
      const error = validateUpdateTask({ status: 'archived' });
      expect(error).toMatch(/status must be one of: todo, in_progress, done/i);
    });

    test('rejects invalid priority in update', () => {
      const error = validateUpdateTask({ priority: 'critical' });
      expect(error).toMatch(/priority must be one of: low, medium, high/i);
    });

    test('rejects invalid dueDate in update', () => {
      const error = validateUpdateTask({ dueDate: 'yesterday' });
      expect(error).toMatch(/dueDate must be a valid ISO date string/i);
    });
  });

  describe('validateAssignTask', () => {
    test('returns null for valid assignee', () => {
      const error = validateAssignTask({ assignee: 'Alice' });
      expect(error).toBeNull();
    });

    test('rejects missing assignee', () => {
      expect(validateAssignTask({})).toMatch(/assignee is required/i);
      expect(validateAssignTask({ assignee: undefined })).toMatch(/assignee is required/i);
    });

    test('rejects non-string assignee', () => {
      expect(validateAssignTask({ assignee: 123 })).toMatch(/assignee is required/i);
      expect(validateAssignTask({ assignee: null })).toMatch(/assignee is required/i);
      expect(validateAssignTask({ assignee: {} })).toMatch(/assignee is required/i);
      expect(validateAssignTask({ assignee: true })).toMatch(/assignee is required/i);
    });

    test('rejects empty or whitespace-only assignee', () => {
      expect(validateAssignTask({ assignee: '' })).toMatch(/assignee is required/i);
      expect(validateAssignTask({ assignee: '   ' })).toMatch(/assignee is required/i);
    });

    test('rejects non-object body', () => {
      expect(validateAssignTask(null)).toMatch(/assignee is required/i);
      expect(validateAssignTask(undefined)).toMatch(/assignee is required/i);
    });
  });
});
