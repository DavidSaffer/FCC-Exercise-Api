const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

//tvd8KbwFQceyTImv
// db_user db_user_password1
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true, // Ensure username is unique
    required: true, // Ensure username is provided
  },
});

// /api/users/6647f696f3f0350013ad120a/logs?from=2020-11-11

const exerciseSchema = mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
});

const logEntrySchema = mongoose.Schema({
  description: String,
  duration: Number,
  date: Date,
});

const logSchema = mongoose.Schema({
  username: String,
  count: Number,
  log: [logEntrySchema],
});

const Log = mongoose.model("Log", logSchema);
const LogEntry = mongoose.model("LogEntry", logEntrySchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// USER section
const userPostHandler = function (req, res) {
  const { username } = req.body;
  // Create the new user
  const newUser = new User({ username: username });
  newUser
    .save()
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.status(400).json({ error: err.message });
    });
};
const userGetHandler = async function (req, res) {
  try {
    const data = await User.find();
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
app.route("/api/users").post(userPostHandler).get(userGetHandler);

// Exercise section
const exercisePostHandler = async function (req, res) {
  const userId = req.params._id;
  let user;
  try {
    user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.log("error here1");
    return res.status(400).json({ error: err.message });
  }

  let { description, duration, date } = req.body;
  date = date ? new Date(date) : new Date(); // Use current date if none provided

  const newExercise = new Exercise({
    username: user.username,
    description: description,
    duration: parseInt(duration, 10),
    date: date,
  });

  try {
    const savedExercise = await newExercise.save();

    // Check if log exists for the user, if not, create it
    let log = await Log.findOne({ username: user.username });
    if (!log) {
      log = new Log({ username: user.username, count: 0, log: [] });
    }

    // Add exercise to log
    log.log.push({
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: savedExercise.date,
    });

    // Update count
    log.count = log.log.length;

    // Save log
    await log.save();

    // Modify the response to include user details with the exercise
    res.json({
      _id: user._id,
      username: user.username,
      date: savedExercise.date.toDateString(), // Format the date to a more readable form
      duration: savedExercise.duration,
      description: savedExercise.description,
    });
  } catch (err) {
    console.log("error here2");
    return res.status(400).json({ error: err.message });
  }
};

app.route("/api/users/:_id/exercises").post(exercisePostHandler);

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const query = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const logDocument = await Log.findOne({ username: user.username });
    if (!logDocument || !logDocument.log || logDocument.log.length === 0) {
      return res.json({
        _id: userId,
        username: user.username,
        count: 0,
        log: [],
      });
    }

    // Use the filterLogsByDateAndLimit function to process logs
    const processedLogs = filterLogsByDateAndLimit(logDocument.log, query);

    // Format and send logs
    const response = {
      _id: userId,
      username: user.username,
      count: processedLogs.length,
      log: processedLogs.map((log) => ({
        description: log.description,
        duration: log.duration,
        date: log.date.toDateString(), // Format date for readability
      })),
    };

    res.json(response);
  } catch (err) {
    console.error("Database or server error on fetching logs", err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
});

function filterLogsByDateAndLimit(logs, { from, to, limit }) {
  // Convert date strings to Date objects
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  const logLimit = parseInt(limit, 10);

  // Filter logs based on date range
  let filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.date);
    return (!fromDate || logDate >= fromDate) && (!toDate || logDate <= toDate);
  });

  // Apply limit to logs
  if (!isNaN(logLimit)) {
    filteredLogs = filteredLogs.slice(0, logLimit);
  }

  return filteredLogs;
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
