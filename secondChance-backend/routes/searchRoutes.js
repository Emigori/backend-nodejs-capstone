const express = require('express')
const router = express.Router()
const connectToDatabase = require('../models/db')

router.get('/', async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')

    const { category, condition, age_years: ageYears, name } = req.query

    const query = {}

    if (name && name.trim() !== '') {
      query.name = { $regex: name, $options: 'i' }
    }

    // Filter by category
    if (category) {
      query.category = category
    }

    // Filter by condition
    if (condition) {
      query.condition = condition
    }

    // Filter by age (in years, less than or equal to)
    if (ageYears) {
      query.age_years = { $lte: parseInt(ageYears) }
    }

    const searchResults = await collection.find(query).toArray()
    res.json(searchResults)
  } catch (e) {
    next(e)
  }
})

module.exports = router
