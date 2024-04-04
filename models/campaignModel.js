const mongoose = require('mongoose')

const campaignSchema = new mongoose.Schema({
  campaignTitle: { 
    type: String, required: true 
  },
  title: { 
    type: String, required: true 
  },
  body: { 
    type: String, required: true 
  },
  bgImage: { 
    type: String 
  },
  payload: { 
    type: mongoose.Schema.Types.Mixed 
  },
  total: { 
    type: Number, 
    default: 0 
  },
  total_sent: { 
    type: Number, 
    default: 0 
  },
  total_processed: { 
    type: Number, 
    default: 0 
  },
  total_failed: { 
    type: Number, 
    default: 0 
  },
  duration: { 
    type: Number,
    default: 0 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Campaign', campaignSchema)
