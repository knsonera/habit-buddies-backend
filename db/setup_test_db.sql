-- Drop and create the test database
DROP DATABASE IF EXISTS habit_buddies_test;
CREATE DATABASE habit_buddies_test;

\c habit_buddies_test

-- Run the create_db.sql script
\i create_tables.sql