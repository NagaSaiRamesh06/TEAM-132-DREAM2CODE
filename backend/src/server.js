const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI;

(async () => {
  try {
    await connectDB(MONGO);
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error('Startup error', err);
    process.exit(1);
  }
})();
