require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../app');
const pool = require('../db');

describe('Friendships Endpoints', () => {
    let userToken1, userToken2;
    let userId1, userId2;

    beforeAll(async () => {

        // Sign up and log in two test users
        const signupRes1 = await request(app)
            .post('/auth/signup')
            .send({
                email: 'testuser1@example.com',
                password: 'testpassword',
                username: 'testuser1',
                fullname: 'Test User 1'
            });
        userId1 = signupRes1.body.userId;

        const res1 = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser1@example.com',
                password: 'testpassword'
            });
        userToken1 = res1.body.token;

        const signupRes2 = await request(app)
            .post('/auth/signup')
            .send({
                email: 'testuser2@example.com',
                password: 'testpassword',
                username: 'testuser2',
                fullname: 'Test User 2'
            });
        userId2 = signupRes2.body.userId;

        const res2 = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser2@example.com',
                password: 'testpassword'
            });
        userToken2 = res2.body.token;
    });

    afterAll(async () => {
        await pool.end(); // Close the database connection after tests
    });

    it('should send a friend request', async () => {
        const res = await request(app)
            .post('/friendships/request')
            .send({ userId: userId1, friendId: userId2 })
            .set('Authorization', `Bearer ${userToken1}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'pending');
    });

    it('should not allow duplicate friend requests', async () => {
        const res = await request(app)
            .post('/friendships/request')
            .send({ userId: userId1, friendId: userId2 })
            .set('Authorization', `Bearer ${userToken1}`);
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Friendship already exists or is pending');
    });

    it('should allow the friend to approve the request', async () => {
        const res = await request(app)
            .put('/friendships/approve')
            .send({ userId: userId2, friendId: userId1 })
            .set('Authorization', `Bearer ${userToken2}`); // User 2 approves
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'active');
    });

    it('should allow either user to remove the friendship', async () => {
        const res = await request(app)
            .delete('/friendships/remove')
            .send({ userId: userId1, friendId: userId2 })
            .set('Authorization', `Bearer ${userToken1}`); // User 1 removes friendship
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Friendship removed successfully');
    });

    it('should prevent unauthorized users from approving a friend request', async () => {
        const res = await request(app)
            .put('/friendships/approve')
            .send({ userId: userId2, friendId: userId1 }) // Trying to approve as User 1
            .set('Authorization', `Bearer ${userToken1}`); // Should fail because User 2 should approve
        expect(res.statusCode).toEqual(404); // Should fail to find a pending request from User 1 to User 2
    });
});
