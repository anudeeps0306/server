require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('../routes/auth');
const urlRoutes = require('../routes/url');
const redirectRoute = require('../routes/redirect');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/', redirectRoute);

const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function initializeUser() {
  try {
    const userExists = await User.findOne({ email: 'intern@dacoid.com' });
    if (!userExists) {
      const hashedPassword = await bcrypt.hash('Test123', 10);
      await User.create({
        email: 'intern@dacoid.com',
        password: hashedPassword
      });
      console.log('Default user created');
    }
  } catch (error) {
    console.error('Error initializing default user:', error);
  }
}

initializeUser();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));