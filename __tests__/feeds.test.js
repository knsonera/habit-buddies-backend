const request = require('supertest');
const app = require('../app');
const pool = require('../db');

jest.mock('../db');

describe('News Feed Endpoints', () => {
    let userToken;
    let userId;

    beforeAll(async () => {
        // Create a new user for testing
        const signupRes = await request(app)
            .post('/auth/signup')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword',
                username: 'testuser',
                fullname: 'Test User'
            });
        userId = signupRes.body.userId;

        // Log in the newly created user to get the token
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'testpassword'
            });
        userToken = loginRes.body.token;
    });

    afterAll(async () => {
        // Delete the test user after the tests are completed
        await pool.query('DELETE FROM Users WHERE user_id = $1', [userId]);
        await pool.end(); // Close the database connection after tests
    });

    describe('GET /quests', () => {
        it('should fetch quests for the user\'s newsfeed', async () => {
            // Mock the database response for a successful quest fetch
            pool.query.mockResolvedValueOnce({
                rows: [
                    {
                        user_id: userId,
                        fullname: 'Test User',
                        quest_id: 1,
                        quest_name: 'Test Quest',
                        action: 'active',
                        role: 'member',
                        action_time: '2023-08-01T10:00:00Z',
                    },
                ],
            });

            const res = await request(app)
                .get('/quests')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('quest_name', 'Test Quest');
            expect(res.body[0]).toHaveProperty('action', 'active');
        });

        it('should return an empty array if no quests are found', async () => {
            // Mock the database response for no quests
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/quests')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(0);
        });

        it('should return 500 if an error occurs', async () => {
            // Mock a database failure
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .get('/quests')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Internal server error');
        });
    });

    describe('GET /checkins', () => {
        it('should fetch check-ins for the user\'s newsfeed', async () => {
            // Mock the database response for successful check-ins fetch
            pool.query.mockResolvedValueOnce({
                rows: [
                    {
                        checkin_id: 1,
                        created_at: '2023-08-01T12:00:00Z',
                        user_id: userId,
                        fullname: 'Test User',
                        quest_name: 'Test Quest',
                    },
                ],
            });

            const res = await request(app)
                .get('/checkins')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty('quest_name', 'Test Quest');
            expect(res.body[0]).toHaveProperty('checkin_id', 1);
        });

        it('should return an empty array if no check-ins are found', async () => {
            // Mock the database response for no check-ins
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/checkins')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(0);
        });

        it('should return 500 if an error occurs', async () => {
            // Mock a database failure
            pool.query.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .get('/checkins')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Internal server error');
        });
    });
});
