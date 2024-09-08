const request = require('supertest');
const app = require('../app');
const pool = require('../db');

jest.mock('../db');

describe('Power-Ups Endpoints', () => {
    let userToken;
    let userId;
    let powerUpId;

    beforeAll(async () => {
        // Create a new user for testing
        const signupRes = await request(app)
            .post('/auth/signup')
            .send({
                email: 'testpowerupuser@example.com', // Unique email for testing
                password: 'testpassword',
                username: 'poweruser',
                fullname: 'Power User'
            });
        userId = signupRes.body.userId;

        // Log in the newly created user to get the token
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'testpowerupuser@example.com',
                password: 'testpassword'
            });
        userToken = loginRes.body.token;
    });

    afterAll(async () => {
        // Delete the test user after the tests are completed
        await pool.query('DELETE FROM Users WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM PowerUps WHERE sender_id = $1 OR receiver_id = $1', [userId]);
        await pool.end(); // Close the database connection after tests
    });

    describe('POST /powerups', () => {
        it('should send a power-up to another user', async () => {
            // Mock the database response for successful power-up creation
            pool.query.mockResolvedValueOnce({
                rows: [{
                    power_up_id: 1,
                    sender_id: userId,
                    receiver_id: 2,
                    event_type: 'UserQuest',
                    event_id: 1,
                    message: 'Great job!',
                    is_read: false,
                    created_at: '2023-08-01T12:00:00Z',
                }],
            });

            const res = await request(app)
                .post('/powerups')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    receiver_id: 2, // Assuming user with ID 2 exists
                    event_type: 'UserQuest',
                    event_id: 1,
                    message: 'Great job!',
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('power_up_id');
            expect(res.body).toHaveProperty('message', 'Great job!');
            powerUpId = res.body.power_up_id;
        });

        it('should return 500 if an error occurs during power-up creation', async () => {
            // Mock a database failure
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .post('/powerups')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    receiver_id: 2,
                    event_type: 'UserQuest',
                    event_id: 1,
                    message: 'Great job!',
                });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Internal server error');
        });
    });

    describe('GET /powerups/unread', () => {
        it('should fetch unread power-ups for the user', async () => {
            // Mock the database response for unread power-ups
            pool.query.mockResolvedValueOnce({
                rows: [
                    {
                        power_up_id: 1,
                        sender_id: 1,
                        receiver_id: userId,
                        event_type: 'UserQuest',
                        event_id: 1,
                        message: 'Great job!',
                        is_read: false,
                        created_at: '2023-08-01T12:00:00Z',
                        sender_fullname: 'John Doe',
                        quest_name: 'Test Quest',
                    },
                ],
            });

            const res = await request(app)
                .get('/powerups/unread')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('message', 'Great job!');
            expect(res.body[0]).toHaveProperty('sender_fullname', 'John Doe');
        });

        it('should return an empty array if there are no unread power-ups', async () => {
            // Mock the database response for no unread power-ups
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/powerups/unread')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(0);
        });

        it('should return 500 if an error occurs while fetching unread power-ups', async () => {
            // Mock a database failure
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .get('/powerups/unread')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Internal server error');
        });
    });

    describe('PUT /powerups/:id/read', () => {
        it('should mark a power-up as read', async () => {
            // Mock the database response for marking the power-up as read
            pool.query.mockResolvedValueOnce({
                rows: [{
                    power_up_id: powerUpId,
                    is_read: true,
                }],
            });

            const res = await request(app)
                .put(`/powerups/${powerUpId}/read`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('is_read', true);
        });

        it('should return 500 if an error occurs while marking power-up as read', async () => {
            // Mock a database failure
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .put(`/powerups/${powerUpId}/read`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Internal server error');
        });
    });
});
