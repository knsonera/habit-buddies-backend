-- Drop and create the database
DROP DATABASE IF EXISTS habit_buddies;
CREATE DATABASE habit_buddies;

\c habit_buddies

-- Run the create_db.sql script
\i create_tables.sql