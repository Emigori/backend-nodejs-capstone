const express = require('express')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const connectToDatabase = require('../models/db')
const dotenv = require('dotenv')
const pino = require('pino')

dotenv.config()
const router = express.Router()
const logger = pino()
const JWT_SECRET = process.env.JWT_SECRET

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('users')

    const existingEmail = await collection.findOne({ email: req.body.email })
    if (existingEmail) {
      logger.error('Email id already exists')
      return res.status(400).json({ error: 'Email id already exists' })
    }

    const salt = await bcryptjs.genSalt(10)
    const hash = await bcryptjs.hash(req.body.password, salt)

    const newUser = await collection.insertOne({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hash,
      createdAt: new Date()
    })

    const payload = {
      user: {
        id: newUser.insertedId
      }
    }

    const authtoken = jwt.sign(payload, JWT_SECRET)
    logger.info('User registered successfully')

    res.json({ authtoken, email: req.body.email })
  } catch (e) {
    logger.error(e)
    return res.status(500).send('Internal server error')
  }
})

// Login an existing user
router.post('/login', async (req, res) => {
  try {
    // Task 1: Connect to `secondChance` in MongoDB
    const db = await connectToDatabase()

    // Task 2: Access MongoDB `users` collection
    const collection = db.collection('users')

    // Task 3: Check for user credentials in database
    const theUser = await collection.findOne({ email: req.body.email })

    if (theUser) {
      // Task 4: Check if password matches
      const result = await bcryptjs.compare(req.body.password, theUser.password)
      if (!result) {
        logger.error('Passwords do not match')
        return res.status(404).json({ error: 'Wrong password' })
      }

      // Task 5: Fetch user details
      const userName = theUser.firstName
      const userEmail = theUser.email

      // Task 6: Create JWT authentication
      const payload = {
        user: {
          id: theUser._id.toString()
        }
      }
      const authtoken = jwt.sign(payload, JWT_SECRET)

      return res.status(200).json({ authtoken, userName, userEmail })
    } else {
      // Task 7: User not found
      logger.error('User not found')
      return res.status(404).json({ error: 'User not found' })
    }
  } catch (e) {
    logger.error(e)
    return res.status(500).send('Internal server error')
  }
})

// Update user profile
router.put('/update', async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logger.error('Validation errors in update request', errors.array())
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const email = req.headers.email
    if (!email) {
      logger.error('Email not found in the request headers')
      return res.status(400).json({ error: 'Email not found in the request headers' })
    }

    const db = await connectToDatabase()
    const collection = db.collection('users')

    const existingUser = await collection.findOne({ email })
    if (!existingUser) {
      logger.error('User not found')
      return res.status(404).json({ error: 'User not found' })
    }

    existingUser.firstName = req.body.name || existingUser.firstName
    existingUser.updatedAt = new Date()

    const updatedUser = await collection.findOneAndUpdate(
      { email },
      { $set: existingUser },
      { returnDocument: 'after' }
    )

    const payload = {
      user: {
        id: updatedUser._id.toString()
      }
    }

    const authtoken = jwt.sign(payload, JWT_SECRET)
    res.json({ authtoken })
  } catch (e) {
    logger.error(e)
    return res.status(500).send('Internal server error')
  }
})

module.exports = router
