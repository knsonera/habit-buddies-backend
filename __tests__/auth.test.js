const request = require('supertest');
const app = require('../app');
const pool = require('../db');

describe('Auth Endpoints', () => {
    let userToken;
    let refreshToken;

    beforeAll(async () => {
        await pool.query('DELETE FROM Users'); // Clear the Users table before tests
    });

    afterAll(async () => {
        await pool.end(); // Close the database connection after tests
    });

    it('should sign up a new user', async () => {
        const res = await request(app)
            .post('/auth/signup')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword',
                username: 'testuser',
                fullname: 'Test User'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body).toHaveProperty('userId');
    });

    it('should not sign up a user with existing email', async () => {
        const res = await request(app)
            .post('/auth/signup')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword',
                username: 'newuser',
                fullname: 'New User'
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Email already in use');
    });

    it('should log in an existing user', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body).toHaveProperty('userId');
        userToken = res.body.token;
        refreshToken = res.body.refreshToken;
    });

    it('should not log in with invalid credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'wronguser@example.com',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should refresh token', async () => {
        const res = await request(app)
            .post('/auth/refresh-token')
            .send({ refreshToken });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('refreshToken');
    });

    it('should not refresh with invalid refresh token', async () => {
        const res = await request(app)
            .post('/auth/refresh-token')
            .send({ refreshToken: 'invalidtoken' });
        expect(res.statusCode).toEqual(403);
        expect(res.body).toHaveProperty('error', 'Invalid refresh token');
    });

    it('should check token validity', async () => {
        const res = await request(app)
            .post('/auth/check-token')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(200);
    });

    it('should return 401 for missing token', async () => {
        const res = await request(app)
            .post('/auth/check-token');
        expect(res.statusCode).toEqual(401);
    });

    it('should return 403 for invalid token', async () => {
        const res = await request(app)
            .post('/auth/check-token')
            .set('Authorization', `Bearer invalidtoken`);
        expect(res.statusCode).toEqual(403);
    });

    it('should log out the user', async () => {
        const res = await request(app)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(200);
    });
});
