const request = require('supertest');
const app = require('../app');
const pool = require('../db');

describe('Users Endpoints', () => {
    let userToken;
    let userId;

    beforeAll(async () => {

        // Sign up and log in a test user to get a token
        const signupRes = await request(app)
            .post('/auth/signup')
            .send({
                email: 'testuser2@example.com',
                password: 'testpassword',
                username: 'testuser2',
                fullname: 'Test User 2'
            });

        userId = signupRes.body.userId;

        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser2@example.com',
                password: 'testpassword'
            });
        userToken = res.body.token;
    });

    afterAll(async () => {
        await pool.end(); // Close the database connection after tests
    });

    it('should fetch user details', async () => {
        const res = await request(app)
            .get(`/users/${userId}`) // Ensure this matches the created user ID
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('username', 'testuser2');
    });

    it('should return 401 for missing token', async () => {
        const res = await request(app)
            .get(`/users/${userId}`);
        expect(res.statusCode).toEqual(401);
    });

    it('should return 403 for invalid token', async () => {
        const res = await request(app)
            .get(`/users/${userId}`)
            .set('Authorization', `Bearer invalidtoken`);
        expect(res.statusCode).toEqual(403);
    });

    it('should update user details', async () => {
        const res = await request(app)
            .put(`/users/${userId}`) // Ensure this matches the created user ID
            .send({ email: 'updateduser@example.com', avatar_id: 2, username: 'testuser2' })
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('email', 'updateduser@example.com');
    });

    it('should return 401 for missing token on update', async () => {
        const res = await request(app)
            .put(`/users/${userId}`)
            .send({ email: 'updateduser@example.com', avatar_id: 2, username: 'testuser2' });
        expect(res.statusCode).toEqual(401);
    });

    it('should return 403 for invalid token on update', async () => {
        const res = await request(app)
            .put(`/users/${userId}`)
            .send({ email: 'updateduser@example.com', avatar_id: 2, username: 'testuser2' })
            .set('Authorization', `Bearer invalidtoken`);
        expect(res.statusCode).toEqual(403);
    });
});
