const express = require('express');
const router = require('./router');

const app = express();
const PORT = process.env.PORT || 3000;

// Use router for all requests
app.use('/api', router);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
