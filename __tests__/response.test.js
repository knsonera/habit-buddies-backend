const request = require('supertest');
const app = require('../app');
const pool = require('../db');

describe('Auth Endpoints - Response Structure', () => {
    beforeAll(async () => {
        // Do this before all tests
    });

    afterAll(async () => {
        // Close the database connection after tests
        await pool.end();
    });

    it('should sign up a new user and return a valid response structure', async () => {
        const res = await request(app)
            .post('/auth/signup')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword',
                username: 'testuser',
                fullname: 'Test User'
            });

        // Check status code
        expect(res.statusCode).toEqual(201);

        // Check the response body
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body).toHaveProperty('userId');

        // Additional checks
        expect(typeof res.body.token).toBe('string');
        expect(typeof res.body.refreshToken).toBe('string');
        expect(typeof res.body.userId).toBe('number'); // or 'string', depending on how `user_id` is stored
    });

    it('should log in an existing user and return a valid response structure', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword'
            });

        // Check status code
        expect(res.statusCode).toEqual(200);

        // Check the response body
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body).toHaveProperty('userId');

        // Additional checks
        expect(typeof res.body.token).toBe('string');
        expect(typeof res.body.refreshToken).toBe('string');
        expect(typeof res.body.userId).toBe('number'); // or 'string', depending on how `user_id` is stored
    });

    // Similar test for token refresh
    it('should refresh token and return a valid response structure', async () => {
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword'
            });

        const res = await request(app)
            .post('/auth/refresh-token')
            .send({ refreshToken: loginRes.body.refreshToken });

        // Check status code
        expect(res.statusCode).toEqual(200);

        // Check the response body
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body).toHaveProperty('userId');

        // Additional checks
        expect(typeof res.body.token).toBe('string');
        expect(typeof res.body.refreshToken).toBe('string');
        expect(typeof res.body.userId).toBe('number'); // or 'string', depending on how `user_id` is stored
    });
});
