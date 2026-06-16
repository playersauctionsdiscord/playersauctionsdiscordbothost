import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: "" },
});

const vouchSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  vouches: { type: Number, default: 0 },
  deals: { type: Number, default: 0 },
});

const flopSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: "" },
  count: { type: Number, default: 0 },
});

const permissionSchema = new mongoose.Schema({
  commandName: { type: String, required: true },
  allowedRoles: [String],
  deniedRoles: [String],
});

export const Config = mongoose.model("Config", configSchema);
export const Vouch = mongoose.model("Vouch", vouchSchema);
export const Flop = mongoose.model("Flop", flopSchema);
export const Permission = mongoose.model("Permission", permissionSchema);

export async function getConfig(key, defaultValue = "") {
  let doc = await Config.findOne({ key });
  if (!doc) {
    doc = await Config.create({ key, value: defaultValue });
  }
  return doc.value || defaultValue;
}

export async function setConfig(key, value) {
  await Config.findOneAndUpdate({ key }, { value }, { upsert: true });
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // Seed defaults
  await getConfig("global_server_title", "PlayerAuctions Marketplace");
  await getConfig("global_banner_url", "");
  await getConfig("staff_role_id", "");
  await getConfig("log_channel_id", "");
}
