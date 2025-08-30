import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  chips: { type: Number, default: 1000 },
  avatar: String,
  isOnline: { type: Boolean, default: false },
  socketId: { type: String, default: null }
});

export default mongoose.model("User", userSchema);
