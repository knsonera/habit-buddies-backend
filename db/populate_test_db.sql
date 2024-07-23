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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES Users(user_id),
    CONSTRAINT quests_status_check CHECK (status IN ('active', 'completed', 'dropped'))
);

CREATE TABLE UserQuests (
    user_quest_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    quest_id INT REFERENCES Quests(quest_id),
    status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) NOT NULL,
    CONSTRAINT user_quest_role_check CHECK (role IN ('owner', 'participant')),
    UNIQUE (user_id, quest_id)
);

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

