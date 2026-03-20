const request = require('supertest');
const app = require('../src/server');

let userToken, adminToken, taskId, userId;

const adminCreds = { email: 'admin@primetrade.ai', password: 'Admin@123456' };
const userCreds = { email: `testuser_${Date.now()}@example.com`, password: 'Test@1234' };

describe('Health Endpoints', () => {
  it('GET /api/v1/health → 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });
});

describe('Auth Endpoints', () => {
  it('POST /register → 201 with tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: userCreds.email,
      password: userCreds.password,
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    userToken = res.body.data.accessToken;
    userId = res.body.data.user.id;
  });

  it('POST /register → 422 for weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test', email: 'test2@example.com', password: 'weak',
    });
    expect(res.status).toBe(422);
  });

  it('POST /register → 409 for duplicate email', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test', email: userCreds.email, password: userCreds.password,
    });
    expect(res.status).toBe(409);
  });

  it('POST /login → 200 with admin', async () => {
    const res = await request(app).post('/api/v1/auth/login').send(adminCreds);
    expect(res.status).toBe(200);
    adminToken = res.body.data.accessToken;
  });

  it('POST /login → 401 for wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: adminCreds.email, password: 'WrongPass@123',
    });
    expect(res.status).toBe(401);
  });

  it('GET /me → 200 with token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(userCreds.email);
  });

  it('GET /me → 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Task Endpoints', () => {
  it('POST /tasks → 201 creates task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test Task', description: 'Test desc', priority: 'high' });
    expect(res.status).toBe(201);
    taskId = res.body.data.id;
  });

  it('GET /tasks → 200 lists tasks', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('GET /tasks/:id → 200', async () => {
    const res = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(taskId);
  });

  it('PATCH /tasks/:id → 200 updates task', async () => {
    const res = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('GET /tasks/stats → 200', async () => {
    const res = await request(app)
      .get('/api/v1/tasks/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  it('DELETE /tasks/:id → 200', async () => {
    const res = await request(app)
      .delete(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Admin User Endpoints', () => {
  it('GET /users → 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /users → 200 for admin', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /users/dashboard → 200 for admin', async () => {
    const res = await request(app)
      .get('/api/v1/users/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data).toHaveProperty('tasks');
  });
});
