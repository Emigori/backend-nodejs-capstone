const express = require('express')
const router = express.Router()
const multer = require('multer')
const connectToDatabase = require('../models/db')
const logger = require('../logger')

const directoryPath = 'public/images'
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, directoryPath),
  filename: (req, file, cb) => cb(null, file.originalname)
})
const upload = multer({ storage })

// Get all secondChance items
router.get('/', async (req, res, next) => {
  try {
    // Task 2: connect to the database using connectToDatabase()
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const secondChanceItems = await collection.find({}).toArray()
    res.json(secondChanceItems)
  } catch (e) {
    logger.error('Error fetching secondChance items', e)
    next(e)
  }
})

// Add a new secondChance item (accepts image upload)
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    let secondChanceItem = req.body

    const lastItemQuery = await collection.find().sort({ id: -1 }).limit(1)
    await lastItemQuery.forEach(item => {
      secondChanceItem.id = (parseInt(item.id) + 1).toString()
    })

    const dateAdded = Math.floor(new Date().getTime() / 1000)
    secondChanceItem.date_added = dateAdded

    secondChanceItem = await collection.insertOne(secondChanceItem)

    if (req.file) {
      secondChanceItem.image = `/images/${req.file.filename}`
    }

    res.status(201).json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Get a single secondChance item by id
router.get('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const secondChanceItem = await collection.findOne({ id: req.params.id })
    if (!secondChanceItem) {
      return res.status(404).send('secondChanceItem not found')
    }

    res.json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Update an existing secondChance item
router.put('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const secondChanceItem = await collection.findOne({ id: req.params.id })
    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }

    secondChanceItem.category = req.body.category
    secondChanceItem.condition = req.body.condition
    secondChanceItem.age_days = req.body.age_days
    secondChanceItem.age_years = Number((secondChanceItem.age_days / 365).toFixed(1))
    secondChanceItem.description = req.body.description
    secondChanceItem.updatedAt = new Date()

    await collection.findOneAndUpdate(
      { id: req.params.id },
      { $set: secondChanceItem },
      { returnDocument: 'after' }
    )

    res.json({ uploaded: 'success' })
  } catch (e) {
    next(e)
  }
})

// Delete a secondChance item
router.delete('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const secondChanceItem = await collection.findOne({ id: req.params.id })
    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }

    await collection.deleteOne({ id: req.params.id })
    res.json({ deleted: 'success' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
