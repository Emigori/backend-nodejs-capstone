const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./logger');

const connectToDatabase = require('./models/db');
const secondChanceItemsRoutes = require('./routes/secondChanceItemsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use('*', cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Connect to MongoDB when the app starts
connectToDatabase()
    .then(() => {
        logger.info('Connected to DB');
    })
    .catch((e) => logger.error('Failed to connect to DB', e));

app.use('/api/secondchance/items', secondChanceItemsRoutes);
app.use('/api/secondchance/search', searchRoutes);
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
    res.send("Inside the server");
});

app.use((err, req, res, next) => {
    logger.error(err);
    res.status(500).send('Internal Server Error');
});

const port = process.env.PORT || 3060;
app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});

module.exports = app;
