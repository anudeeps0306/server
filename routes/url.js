const express = require("express");
const router = express.Router();
const { nanoid } = require("nanoid");
const auth = require("../middleware/auth");
const Url = require("../src/models/Url");
const ClickData = require("../src/models/ClickData");

// @route   POST api/url
// @desc    Create a short URL
// @access  Private
router.post("/", auth, async (req, res) => {
  const { originalUrl, customAlias, expirationDate } = req.body;

  try {
    new URL(originalUrl);
  } catch (err) {
    return res.status(400).json({ msg: "Invalid URL" });
  }

  try {
    let shortCode;
    if (customAlias) {
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res.status(400).json({ msg: "Custom alias already in use" });
      }
      shortCode = customAlias;
    } else {
      shortCode = nanoid(6);
    }

    let urlData = {
      userId: req.user.id,
      originalUrl,
      shortCode,
    };

    if (expirationDate) {
      urlData.expiresAt = new Date(expirationDate);
    }

    let url = new Url(urlData);
    await url.save();

    res.json(url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   GET api/url
// @desc    Get all URLs for a user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(urls);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   GET api/url/:id/analytics
// @desc    Get analytics for a specific URL
// @access  Private
router.get("/:id/analytics", auth, async (req, res) => {
  try {
    const url = await Url.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!url) {
      return res.status(404).json({ msg: "URL not found" });
    }

    const clickData = await ClickData.find({ urlId: url._id });

    const clicksByDate = {};
    const devices = {};
    const browsers = {};

    clickData.forEach((click) => {
      const date = new Date(click.timestamp).toISOString().split("T")[0];

      if (clicksByDate[date]) {
        clicksByDate[date]++;
      } else {
        clicksByDate[date] = 1;
      }

      if (devices[click.device]) {
        devices[click.device]++;
      } else {
        devices[click.device] = 1;
      }

      if (browsers[click.browser]) {
        browsers[click.browser]++;
      } else {
        browsers[click.browser] = 1;
      }
    });

    const clicksOverTime = Object.keys(clicksByDate).map((date) => ({
      date,
      clicks: clicksByDate[date],
    }));

    const deviceBreakdown = Object.keys(devices).map((device) => ({
      device,
      count: devices[device],
    }));

    const browserBreakdown = Object.keys(browsers).map((browser) => ({
      browser,
      count: browsers[browser],
    }));

    res.json({
      url,
      clicksOverTime,
      deviceBreakdown,
      browserBreakdown,
      totalClicks: url.clicks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/url/:id
// @desc    Delete a URL
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const url = await Url.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!url) {
      return res.status(404).json({ msg: "URL not found" });
    }

    await ClickData.deleteMany({ urlId: url._id });

    await url.remove();

    res.json({ msg: "URL removed" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
