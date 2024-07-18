-- Create Database
CREATE DATABASE habit_buddies;
\c habit_buddies

-- Create Users table
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    game_score INT DEFAULT 0,
    avatar_id INT DEFAULT 1,
    fullname VARCHAR(100),
    streak INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Categories table
CREATE TABLE Categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

-- Create Quests table
CREATE TABLE Quests (
    quest_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    quest_name VARCHAR(100) NOT NULL,
    description TEXT,
    duration VARCHAR(100) NOT NULL,
    checkin_frequency VARCHAR(50) NOT NULL,
    time VARCHAR(50),
    zoom_link VARCHAR(100),
    icon_id INT DEFAULT 1,
    start_date DATE,
    end_date DATE,
    category_id INT REFERENCES Categories(category_id) DEFAULT 1,
    created_by INT REFERENCES Users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT quests_status_check CHECK (status IN ('active', 'completed', 'dropped'))
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, friend_id),
    CONSTRAINT friendship_status_check CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Create UserBadges table
CREATE TABLE UserBadges (
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
    quest_id INT REFERENCES Quests(quest_id),
    checkin_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create FriendInvites table
CREATE TABLE FriendInvites (
    invite_id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES Users(user_id),
    receiver_id INT REFERENCES Users(user_id),
    quest_id INT REFERENCES Quests(quest_id),
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    CONSTRAINT invites_status_check CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- Create News table
CREATE TABLE News (
    news_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    event_type VARCHAR(50) NOT NULL,
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Chats table
CREATE TABLE Chats (
    chat_id SERIAL PRIMARY KEY,
    quest_id INT REFERENCES Quests(quest_id),
    encrypted_message TEXT NOT NULL,
    sender_id INT REFERENCES Users(user_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT chats_status_check CHECK (status IN ('sent', 'delivered', 'read'))
);

-- Adding indexes for performance
CREATE INDEX idx_quest_id_chats ON Chats(quest_id);
CREATE INDEX idx_sender_id_chats ON Chats(sender_id);
CREATE INDEX idx_user_id_news ON News(user_id);
CREATE INDEX idx_user_id_friendship ON Friendship(user_id);
CREATE INDEX idx_friend_id_friendship ON Friendship(friend_id);

-- Data
INSERT INTO Categories (category_name) VALUES
('Popular'),
('Sports'),
('Nutrition'),
('Happiness'),
('Mindfulness'),
('Self-care'),
('Lifestyle'),
('Relationships'),
('Skills');
