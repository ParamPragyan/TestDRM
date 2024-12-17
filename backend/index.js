const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const videoRouter = require('./router');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());

const corsOptions = {
  origin: [
    '*',
    'http://localhost:5173',
    'https://test-drm2.vercel.app/',
    'https://test-drm2.vercel.app',
    'https://test-drm2.vercel.app/uploadVideo',
  ],
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  credentials: true,
};
app.use(cors(corsOptions));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

app.use('/api/videos', videoRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
