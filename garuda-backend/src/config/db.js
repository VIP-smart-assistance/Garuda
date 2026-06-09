const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log(`
📦  DATABASE INITIALIZATION
────────────────────────────────
🔄  Connecting to MongoDB...
`);

    await mongoose.connect(process.env.MONGO_URI);

    console.log(`
✅  MONGODB CONNECTED SUCCESSFULLY
────────────────────────────────
🗄️  Database : MongoDB
🔗  Status   : Online
⚡  Ready to serve requests
────────────────────────────────
`);
  } catch (err) {
    console.error(`
❌  MONGODB CONNECTION FAILED
────────────────────────────────
🔥  Error : ${err.message}
🛑  Server shutting down
────────────────────────────────
`);
    process.exit(1);
  }
};

module.exports = connectDB;
