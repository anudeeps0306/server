const express = require('express');
const router = express.Router();
const UAParser = require('ua-parser-js');
const Url = require('../src/models/Url');
const ClickData = require('../src/models/ClickData');

// @route   GET /:code
// @desc    Redirect to original URL
// @access  Public
router.get('/:code', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code });

    if (!url) {
      return res.status(404).json({ msg: 'URL not found' });
    }

    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ msg: 'URL has expired' });
    }

    const uaParser = new UAParser(req.headers['user-agent']);
    const parsedUA = uaParser.getResult();

    const clickData = new ClickData({
      urlId: url._id,
      ip: req.ip,
      browser: parsedUA.browser.name || 'Unknown',
      os: parsedUA.os.name || 'Unknown',
      device: parsedUA.device.type || (parsedUA.device.vendor ? `${parsedUA.device.vendor} ${parsedUA.device.model}` : 'Desktop'),
      referrer: req.headers.referer || 'Direct'
    });

    url.clicks += 1;
    
    await Promise.all([
      clickData.save(),
      url.save()
    ]);

    return res.redirect(url.originalUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;