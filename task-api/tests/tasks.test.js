const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('POST /tasks', () => {
    test('creates a task with 201 status and returns created task with defaults', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'New Task' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('New Task');
      expect(res.body.description).toBe('');
      expect(res.body.status).toBe('todo');
      expect(res.body.priority).toBe('medium');
      expect(res.body.dueDate).toBeNull();
      expect(res.body.completedAt).toBeNull();
      expect(res.body.createdAt).toBeDefined();
    });

    test('creates a task with custom fields', async () => {
      const dueDate = new Date().toISOString();
      const res = await request(app)
        .post('/tasks')
        .send({
          title: 'Custom Task',
          description: 'Detailed description',
          status: 'in_progress',
          priority: 'high',
          dueDate,
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Custom Task');
      expect(res.body.description).toBe('Detailed description');
      expect(res.body.status).toBe('in_progress');
      expect(res.body.priority).toBe('high');
      expect(res.body.dueDate).toBe(dueDate);
    });

    test('returns 400 when title is missing or empty or non-string', async () => {
      const resMissing = await request(app).post('/tasks').send({});
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.error).toBeDefined();

      const resEmpty = await request(app).post('/tasks').send({ title: '   ' });
      expect(resEmpty.status).toBe(400);

      const resNum = await request(app).post('/tasks').send({ title: 12345 });
      expect(resNum.status).toBe(400);
    });

    test('returns 400 when status is invalid', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Task', status: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('status must be one of');
    });

    test('returns 400 when priority is invalid', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Task', priority: 'extreme' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('priority must be one of');
    });

    test('returns 400 when dueDate is invalid', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Task', dueDate: 'invalid-date' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('dueDate must be a valid ISO date string');
    });
  });

  describe('GET /tasks', () => {
    test('returns empty array when no tasks exist', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');
    });

    test('filters tasks by status query param', async () => {
      taskService.create({ title: 'Task Todo', status: 'todo' });
      taskService.create({ title: 'Task Done', status: 'done' });

      const res = await request(app).get('/tasks?status=todo');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Task Todo');
    });

    test('supports pagination with page and limit', async () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const res = await request(app).get('/tasks?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');

      const resPage2 = await request(app).get('/tasks?page=2&limit=2');
      expect(resPage2.status).toBe(200);
      expect(resPage2.body.length).toBe(2);
      expect(resPage2.body[0].title).toBe('Task 3');
      expect(resPage2.body[1].title).toBe('Task 4');

      const resOnlyPage = await request(app).get('/tasks?page=1');
      expect(resOnlyPage.status).toBe(200);
      expect(resOnlyPage.body.length).toBe(5);

      const resOnlyLimit = await request(app).get('/tasks?limit=3');
      expect(resOnlyLimit.status).toBe(200);
      expect(resOnlyLimit.body.length).toBe(3);

      const resInvalidParams = await request(app).get('/tasks?page=invalid&limit=invalid');
      expect(resInvalidParams.status).toBe(200);
      expect(resInvalidParams.body.length).toBe(5);
    });

  });

  describe('GET /tasks/stats', () => {
    test('returns correct counts for statuses and overdue tasks', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      taskService.create({ title: 'T1', status: 'todo', dueDate: pastDate });
      taskService.create({ title: 'T2', status: 'in_progress', dueDate: futureDate });
      taskService.create({ title: 'T3', status: 'done', dueDate: pastDate });

      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        todo: 1,
        in_progress: 1,
        done: 1,
        overdue: 1,
      });
    });
  });

  describe('PUT /tasks/:id', () => {
    test('updates an existing task successfully', async () => {
      const task = taskService.create({ title: 'Original' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'Updated', status: 'in_progress', priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
      expect(res.body.title).toBe('Updated');
      expect(res.body.status).toBe('in_progress');
      expect(res.body.priority).toBe('high');
    });

    test('returns 404 if task not found', async () => {
      const res = await request(app)
        .put('/tasks/non-existent-id')
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    test('returns 400 for validation errors during update', async () => {
      const task = taskService.create({ title: 'Original' });

      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ priority: 'invalid_priority' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('deletes an existing task with 204 status', async () => {
      const task = taskService.create({ title: 'To Delete' });

      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(204);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    test('returns 404 when deleting non-existent task', async () => {
      const res = await request(app).delete('/tasks/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('marks task as completed, sets completedAt, and preserves priority', async () => {
      const task = taskService.create({ title: 'Complete Me', priority: 'high' });

      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).toBeDefined();
      expect(res.body.priority).toBe('high'); // MUST preserve priority
    });

    test('returns 404 when completing non-existent task', async () => {
      const res = await request(app).patch('/tasks/non-existent-id/complete');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    test('assigns assignee to task and returns 200 with updated task', async () => {
      const task = taskService.create({ title: 'Assign Me', priority: 'high' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'John' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
      expect(res.body.assignee).toBe('John');
      expect(res.body.title).toBe('Assign Me');
      expect(res.body.priority).toBe('high');
    });

    test('returns 404 when assigning non-existent task', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'John' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    test('returns 400 when assignee is missing', async () => {
      const task = taskService.create({ title: 'Assign Me' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('returns 400 when assignee is empty or whitespace', async () => {
      const task = taskService.create({ title: 'Assign Me' });

      const resEmpty = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '' });
      expect(resEmpty.status).toBe(400);

      const resWhitespace = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '   ' });
      expect(resWhitespace.status).toBe(400);
    });

    test('returns 400 when assignee is not a string', async () => {
      const task = taskService.create({ title: 'Assign Me' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 123 });

      expect(res.status).toBe(400);
    });
  });
});
