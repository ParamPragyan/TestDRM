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
    'https://test-drm2.vercel.app/',
    'https://test-drm2.vercel.app',
  ],
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  credentials: true,
};
app.use(cors(corsOptions));

// mongoose.connect('mongodb+srv://gajananbhosaleaws03:gajanan@cluster1.cgkh7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
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
