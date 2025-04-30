require("dotenv").config();
const express = require("express");
const Pusher = require("pusher");

const port = process.env.PORT || 4000;

const api = express();
const router = express.Router();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: "eu",
});

api.use(express.json());
api.use(express.urlencoded({ extended: true }));
api.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Content-Type", "application/json");
  next();
});

router.post("/ping", (req, res) => {
  const { lat, lng, userId, username, info } = req.body;
  const data = {
    lat,
    lng,
    userId,
    username,
    info,
  };
  pusher.trigger("location", "ping", data);
  res.status(200).json(data);
});
router.post("/remove", (req, res) => {
  const { userId } = req.body;
  const data = { userId };
  pusher.trigger("location", "remove", data);
  res.json(data);
});
router.post("/hello", (req, res) => {
  const { userId } = req.body;
  const data = { userId };
  pusher.trigger("location", "hello", data);
  res.json(data);
});

api.use("", router);
api.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
