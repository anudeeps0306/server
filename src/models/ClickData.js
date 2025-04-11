const mongoose = require('mongoose');

const ClickDataSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String
  },
  browser: {
    type: String
  },
  os: {
    type: String
  },
  device: {
    type: String
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  referrer: {
    type: String,
    default: 'Direct'
  }
});

module.exports = mongoose.model('ClickData', ClickDataSchema);
