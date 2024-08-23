#!/bin/bash

# Load environment variables from .env or .env.test
if [ "$NODE_ENV" == "test" ]; then
    export $(grep -v '^#' ../.env.test | xargs)
else
    export $(grep -v '^#' ../.env | xargs)
fi

# Set the PostgreSQL connection details from environment variables
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
export PGUSER PGPASSWORD 

# Run the development database setup
if [ "$NODE_ENV" != "test" ]; then
    psql -U $PGUSER -h $DB_HOST -p $DB_PORT -d postgres -f setup_db.sql
fi

# Run the test database setup
if [ "$NODE_ENV" == "test" ]; then
    psql -U $PGUSER -h $DB_HOST -p $DB_PORT -d postgres -f setup_test_db.sql
fi