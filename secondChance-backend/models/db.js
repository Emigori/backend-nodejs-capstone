require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

// MongoDB connection URL, loaded from .env
const url = process.env.MONGO_URL;

let dbInstance = null;
const dbName = "secondChance";

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    const client = new MongoClient(url);

    // Task 1 requirement: connect to MongoDB
    await client.connect();

    dbInstance = client.db(dbName);

    return dbInstance;
}

module.exports = connectToDatabase;
