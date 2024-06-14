CREATE DATABASE habit_buddies;

\c habit_buddies

-- Create Users table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    game_score INT DEFAULT 0,
    avatar_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Icons table
CREATE TABLE Icons (
    icon_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    library VARCHAR(100) NOT NULL
);

-- Create Challenges table
CREATE TABLE Challenges (
    challenge_id SERIAL PRIMARY KEY,
    challenge_name VARCHAR(100) NOT NULL,
    description TEXT,
    duration VARCHAR(100) NOT NULL, -- Duration in days
    checkin_frequency VARCHAR(50) NOT NULL, -- e.g., daily, weekly, monthly, custom
    time VARCHAR(50), -- Time as a string
    icon_id INT REFERENCES Icons(icon_id),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Badges table
CREATE TABLE Badges (
    badge_id SERIAL PRIMARY KEY,
    badge_name VARCHAR(100) NOT NULL,
    description TEXT,
    image_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Friendship table
CREATE TABLE Friendship (
    friendship_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    friend_id INT REFERENCES Users(user_id),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create UserChallenge table
CREATE TABLE UserChallenge (
    user_challenge_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    challenge_id INT REFERENCES Challenges(challenge_id),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create UserBadge table
CREATE TABLE UserBadge (
    user_badge_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    badge_id INT REFERENCES Badges(badge_id),
    earned_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Checkins table
CREATE TABLE Checkins (
    checkin_id SERIAL PRIMARY KEY,
    user_challenge_id INT REFERENCES UserChallenge(user_challenge_id),
    checkin_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\dt

-- Insert user Jane Miller
INSERT INTO Users (username, email, password_hash, game_score, avatar_image, created_at, updated_at)
VALUES ('@superjane', 'jane.miller@example.com', 'hashedpassword', 167, 'https://via.placeholder.com/150', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING user_id;

-- Insert user John Smith
INSERT INTO Users (username, email, password_hash, game_score, avatar_image, created_at, updated_at)
VALUES ('@johnnysmm', 'john.smith@example.com', 'hashedpassword', 200, 'https://via.placeholder.com/150', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING user_id;

-- Insert user Emma Watson
INSERT INTO Users (username, email, password_hash, game_score, avatar_image, created_at, updated_at)
VALUES ('@emmaw', 'emma.watson@example.com', 'hashedpassword', 250, 'https://via.placeholder.com/150', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING user_id;

-- Insert icons
INSERT INTO Icons (name, library) VALUES ('trophy', 'FontAwesome');
INSERT INTO Icons (name, library) VALUES ('book', 'FontAwesome');
INSERT INTO Icons (name, library) VALUES ('meditation', 'MaterialCommunityIcons');
INSERT INTO Icons (name, library) VALUES ('no-food', 'MaterialCommunityIcons');
INSERT INTO Icons (name, library) VALUES ('yoga', 'MaterialCommunityIcons');
INSERT INTO Icons (name, library) VALUES ('heart', 'FontAwesome');
INSERT INTO Icons (name, library) VALUES ('apple', 'FontAwesome');
INSERT INTO Icons (name, library) VALUES ('ban', 'FontAwesome');
INSERT INTO Icons (name, library) VALUES ('tint', 'FontAwesome');
INSERT INTO Icons (name, library) VALUES ('pencil', 'FontAwesome');
INSERT INTO Icons (name, library) VALUES ('edit', 'FontAwesome');
INSERT INTO Icons (name, library) VALUES ('leaf', 'FontAwesome');
INSERT INTO Icons (name, library) VALUES ('coffee', 'FontAwesome');

-- Insert challenges for all users
INSERT INTO Challenges (challenge_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date, created_at, updated_at)
VALUES
       ('10,000 Steps Challenge', 'Walk 10,000 steps every day to stay fit and healthy.', '30 days', 'Daily', 'Anytime', (SELECT icon_id FROM Icons WHERE name='trophy' AND library='FontAwesome'), CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Read a Book Challenge', 'Read one book each week.', '4 weeks', 'Weekly', 'Anytime', (SELECT icon_id FROM Icons WHERE name='book' AND library='FontAwesome'), CURRENT_DATE, CURRENT_DATE + INTERVAL '4 weeks', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Meditation Challenge', 'Meditate for 10 minutes daily.', '21 days', 'Daily', 'Morning', (SELECT icon_id FROM Icons WHERE name='meditation' AND library='MaterialCommunityIcons'), CURRENT_DATE, CURRENT_DATE + INTERVAL '21 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('No Sugar Challenge', 'Avoid sugar for 10 days.', '10 days', 'Daily', 'Anytime', (SELECT icon_id FROM Icons WHERE name='no-food' AND library='MaterialCommunityIcons'), CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '10 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Yoga Challenge', 'Practice yoga for 15 minutes daily.', '15 days', 'Daily', 'Morning', (SELECT icon_id FROM Icons WHERE name='yoga' AND library='MaterialCommunityIcons'), CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '15 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('30-Day Fitness Challenge', 'Exercise daily for 30 minutes.', '30 days', 'Daily', 'Evening', (SELECT icon_id FROM Icons WHERE name='heart' AND library='FontAwesome'), CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Healthy Eating Challenge', 'Eat at least 5 servings of fruits and vegetables daily.', '7 days', 'Daily', 'Anytime', (SELECT icon_id FROM Icons WHERE name='apple' AND library='FontAwesome'), CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('No Junk Food Challenge', 'Avoid junk food for 7 days.', '7 days', 'Daily', 'Anytime', (SELECT icon_id FROM Icons WHERE name='ban' AND library='FontAwesome'), CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Water Drinking Challenge', 'Drink 8 glasses of water daily.', '14 days', 'Daily', 'Anytime', (SELECT icon_id FROM Icons WHERE name='tint' AND library='FontAwesome'), CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '6 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Daily Drawing Challenge', 'Draw something new every day.', '30 days', 'Daily', 'Anytime', (SELECT icon_id FROM Icons WHERE name='pencil' AND library='FontAwesome'), CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Writing Challenge', 'Write 500 words daily.', '14 days', 'Daily', 'Anytime', (SELECT icon_id FROM Icons WHERE name='edit' AND library='FontAwesome'), CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Vegetarian Challenge', 'Follow a vegetarian diet for 7 days.', '7 days', 'Daily', 'Anytime', (SELECT icon_id FROM Icons WHERE name='leaf' AND library='FontAwesome'), CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('No Caffeine Challenge', 'Avoid caffeine for 5 days.', '5 days', 'Daily', 'Anytime', (SELECT icon_id FROM Icons WHERE name='coffee' AND library='FontAwesome'), CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '2 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert user challenges for Jane Miller
INSERT INTO UserChallenge (user_id, challenge_id, status, created_at, updated_at)
VALUES
       ((SELECT user_id FROM Users WHERE username='@superjane'), (SELECT challenge_id FROM Challenges WHERE challenge_name='10,000 Steps Challenge'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@superjane'), (SELECT challenge_id FROM Challenges WHERE challenge_name='Read a Book Challenge'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@superjane'), (SELECT challenge_id FROM Challenges WHERE challenge_name='Meditation Challenge'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@superjane'), (SELECT challenge_id FROM Challenges WHERE challenge_name='No Sugar Challenge'), 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@superjane'), (SELECT challenge_id FROM Challenges WHERE challenge_name='Yoga Challenge'), 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert user challenges for John Smith
INSERT INTO UserChallenge (user_id, challenge_id, status, created_at, updated_at)
VALUES
       ((SELECT user_id FROM Users WHERE username='@johnnysmm'), (SELECT challenge_id FROM Challenges WHERE challenge_name='30-Day Fitness Challenge'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@johnnysmm'), (SELECT challenge_id FROM Challenges WHERE challenge_name='Healthy Eating Challenge'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@johnnysmm'), (SELECT challenge_id FROM Challenges WHERE challenge_name='No Junk Food Challenge'), 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@johnnysmm'), (SELECT challenge_id FROM Challenges WHERE challenge_name='Water Drinking Challenge'), 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert user challenges for Emma Watson
INSERT INTO UserChallenge (user_id, challenge_id, status, created_at, updated_at)
VALUES
       ((SELECT user_id FROM Users WHERE username='@emmaw'), (SELECT challenge_id FROM Challenges WHERE challenge_name='Daily Drawing Challenge'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@emmaw'), (SELECT challenge_id FROM Challenges WHERE challenge_name='Writing Challenge'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@emmaw'), (SELECT challenge_id FROM Challenges WHERE challenge_name='Vegetarian Challenge'), 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@emmaw'), (SELECT challenge_id FROM Challenges WHERE challenge_name='No Caffeine Challenge'), 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert badges
INSERT INTO Badges (badge_name, description, image_path, created_at, updated_at)
VALUES
       ('Badge 1', 'Description for badge 1', 'https://via.placeholder.com/50', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Badge 2', 'Description for badge 2', 'https://via.placeholder.com/50', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('Badge 3', 'Description for badge 3', 'https://via.placeholder.com/50', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assign badges to Jane Miller
INSERT INTO UserBadge (user_id, badge_id, earned_date, created_at, updated_at)
VALUES
       ((SELECT user_id FROM Users WHERE username='@superjane'), (SELECT badge_id FROM Badges WHERE badge_name='Badge 1'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@superjane'), (SELECT badge_id FROM Badges WHERE badge_name='Badge 2'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@superjane'), (SELECT badge_id FROM Badges WHERE badge_name='Badge 3'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assign badges to John Smith
INSERT INTO UserBadge (user_id, badge_id, earned_date, created_at, updated_at)
VALUES
       ((SELECT user_id FROM Users WHERE username='@johnnysmm'), (SELECT badge_id FROM Badges WHERE badge_name='Badge 1'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@johnnysmm'), (SELECT badge_id FROM Badges WHERE badge_name='Badge 2'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@johnnysmm'), (SELECT badge_id FROM Badges WHERE badge_name='Badge 3'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assign badges to Emma Watson
INSERT INTO UserBadge (user_id, badge_id, earned_date, created_at, updated_at)
VALUES
       ((SELECT user_id FROM Users WHERE username='@emmaw'), (SELECT badge_id FROM Badges WHERE badge_name='Badge 1'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@emmaw'), (SELECT badge_id FROM Badges WHERE badge_name='Badge 2'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ((SELECT user_id FROM Users WHERE username='@emmaw'), (SELECT badge_id FROM Badges WHERE badge_name='Badge 3'), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
