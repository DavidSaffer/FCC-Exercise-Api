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
  username: String,
});

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
const Excercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const userPostHandler = function (req, res) {
  const { username } = req.body;
  // Create the new user
  const newUser = new User({ username: username });
  newUser.save((err, data) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(data);
  });
};

app.route("/api/users").post(userPostHandler);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
