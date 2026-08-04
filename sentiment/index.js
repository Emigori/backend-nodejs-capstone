const express = require('express')
// Task 1: Import the Natural library
const natural = require('natural')

// Task 2: Initialize the Express server
const app = express()
const port = 3000

const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn')
const tokenizer = new natural.WordTokenizer()

// Task 3: Create a POST /sentiment endpoint
app.post('/sentiment', (req, res) => {
  try {
    // Task 4: Extract the `sentence` parameter from the request query
    const { sentence } = req.query

    const analysisResult = analyzer.getSentiment(tokenizer.tokenize(sentence))

    // Task 5: Process the response from Natural
    let sentiment = 'neutral'
    if (analysisResult < 0) {
      sentiment = 'negative'
    } else if (analysisResult >= 0 && analysisResult <= 0.33) {
      sentiment = 'neutral'
    } else {
      sentiment = 'positive'
    }

    // Task 6: Implement success return state
    res.status(200).json({ sentimentScore: analysisResult, sentiment })
  } catch (err) {
    // Task 7: Implement error return state
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.listen(port, () => {
  console.log(`Sentiment analysis app listening at http://localhost:${port}`)
})
