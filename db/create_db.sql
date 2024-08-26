
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
    start_date DATE DEFAULT CURRENT_DATE,
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
    user_status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) NOT NULL,
    CONSTRAINT user_quest_role_check CHECK (role IN ('owner', 'participant')),
    CONSTRAINT user_quest_status_check CHECK (status IN ('pending', 'invited', 'active')),
    UNIQUE (user_id, quest_id)
);

CREATE TABLE QuestMessages (
    message_id SERIAL PRIMARY KEY,
    quest_id INT REFERENCES Quests(quest_id),
    user_id INT REFERENCES Users(user_id),
    message_text TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Friendships (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    friend_id INT REFERENCES Users(user_id),
    status VARCHAR(10) NOT NULL,  -- 'active' or 'pending'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (user_id <> friend_id),  -- user_id and friend_id are not the same
    UNIQUE (user_id, friend_id) -- the pair of user_id and friend_id is unique
);

CREATE TABLE CheckIns (
    checkin_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    quest_id INT NOT NULL,
    checkin_date DATE DEFAULT CURRENT_DATE,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (quest_id) REFERENCES Quests(quest_id) ON DELETE CASCADE,
    UNIQUE (user_id, quest_id, checkin_date)
);

-- Basic Data
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
