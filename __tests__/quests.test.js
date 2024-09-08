require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../app');
const pool = require('../db');

describe('Quests Endpoints', () => {
    let userToken1, userToken2;
    let userId1, userId2;
    let questId;

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

    it('should create a new quest', async () => {
        const res = await request(app)
            .post('/quests')
            .set('Authorization', `Bearer ${userToken1}`)
            .send({
                quest_name: 'Test Quest',
                description: 'A test quest',
                duration: '7 days',
                checkin_frequency: 'daily',
                time: '12:00',
                icon_id: 1,
                start_date: '2024-01-01',
                end_date: '2024-01-08',
                category_id: 1,
                status: 'active'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('quest_id');
        questId = res.body.quest_id; // Save quest ID for later tests
    });

    it('should fetch all quests', async () => {
        const res = await request(app)
            .get('/quests')
            .set('Authorization', `Bearer ${userToken1}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fetch a quest by ID', async () => {
        const res = await request(app)
            .get(`/quests/${questId}`)
            .set('Authorization', `Bearer ${userToken1}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('quest_id', questId);
    });

    it('should update a quest', async () => {
        const res = await request(app)
            .put(`/quests/${questId}`)
            .set('Authorization', `Bearer ${userToken1}`)
            .send({
                quest_name: 'Updated Quest',
                description: 'An updated description',
                duration: '10 days',
                checkin_frequency: 'daily',
                time: '12:00',
                icon_id: 1,
                start_date: '2024-01-01',
                end_date: '2024-01-11',
                category_id: 1,
                status: 'active'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('quest_name', 'Updated Quest');
    });

    it('should delete the quest by owner', async () => {
        const res = await request(app)
            .delete(`/quests/${questId}`)
            .set('Authorization', `Bearer ${userToken1}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Quest deleted successfully');
    });

    it('should not allow unauthorized users to delete a quest', async () => {
        const res = await request(app)
            .delete(`/quests/${questId}`)
            .set('Authorization', `Bearer ${userToken2}`); // User 2 trying to delete User 1's quest
        expect(res.statusCode).toEqual(404); // Quest should already be deleted by User 1
    });

    it('should allow a user to join a quest', async () => {
        const resCreate = await request(app)
            .post('/quests')
            .set('Authorization', `Bearer ${userToken1}`)
            .send({
                quest_name: 'Joinable Quest',
                description: 'A quest that can be joined',
                duration: '7 days',
                checkin_frequency: 'daily',
                time: '12:00',
                icon_id: 1,
                start_date: '2024-01-01',
                end_date: '2024-01-08',
                category_id: 1,
                status: 'active'
            });
        const newQuestId = resCreate.body.quest_id;

        const resJoin = await request(app)
            .post(`/quests/${newQuestId}/start`)
            .set('Authorization', `Bearer ${userToken2}`);
        expect(resJoin.statusCode).toEqual(201);
        expect(resJoin.body).toHaveProperty('user_quest_id');
    });

    it('should allow an owner to invite a friend to a quest', async () => {
        const resInvite = await request(app)
            .post(`/quests/${questId}/invite`)
            .set('Authorization', `Bearer ${userToken1}`)
            .send({ receiverId: userId2 });
        expect(resInvite.statusCode).toEqual(201);
        expect(resInvite.body).toHaveProperty('user_id', userId2);
    });

    it('should allow a user to approve an invite', async () => {
        const resApprove = await request(app)
            .post(`/quests/${questId}/approve-invite`)
            .set('Authorization', `Bearer ${userToken2}`);
        expect(resApprove.statusCode).toEqual(200);
        expect(resApprove.body).toHaveProperty('status', 'active');
    });

    it('should allow a user to request to join a quest', async () => {
        const resRequest = await request(app)
            .post(`/quests/${questId}/request`)
            .set('Authorization', `Bearer ${userToken2}`);
        expect(resRequest.statusCode).toEqual(201);
        expect(resRequest.body).toHaveProperty('status', 'pending');
    });

    it('should allow an owner to approve a request to join a quest', async () => {
        const resApproveRequest = await request(app)
            .post(`/quests/${questId}/approve-request`)
            .set('Authorization', `Bearer ${userToken1}`)
            .send({ userId: userId2 });
        expect(resApproveRequest.statusCode).toEqual(200);
        expect(resApproveRequest.body).toHaveProperty('status', 'active');
    });

    it('should fetch the owner of the quest', async () => {
        const resOwner = await request(app)
            .get(`/quests/${questId}/owner`)
            .set('Authorization', `Bearer ${userToken1}`);
        expect(resOwner.statusCode).toEqual(200);
        expect(resOwner.body).toHaveProperty('user_id', userId1);
    });

    it('should fetch participants of a quest', async () => {
        const resUsers = await request(app)
            .get(`/quests/${questId}/users`)
            .set('Authorization', `Bearer ${userToken1}`);
        expect(resUsers.statusCode).toEqual(200);
        expect(Array.isArray(resUsers.body)).toBe(true);
    });

    it('should store and fetch messages for a quest', async () => {
        const resMessage = await request(app)
            .post(`/quests/${questId}/messages`)
            .set('Authorization', `Bearer ${userToken1}`)
            .send({ message_text: 'Test message', user_id: userId1 });
        expect(resMessage.statusCode).toEqual(201);
        expect(resMessage.body).toHaveProperty('message_text', 'Test message');

        const resFetchMessages = await request(app)
            .get(`/quests/${questId}/messages`)
            .set('Authorization', `Bearer ${userToken1}`);
        expect(resFetchMessages.statusCode).toEqual(200);
        expect(Array.isArray(resFetchMessages.body)).toBe(true);
        expect(resFetchMessages.body.length).toBeGreaterThan(0);
    });
});
