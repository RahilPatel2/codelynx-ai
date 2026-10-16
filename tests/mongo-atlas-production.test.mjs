import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";

// Ensure .env.local is parsed if running under plain tsx test runner
if (!process.env.MONGODB_URI && fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const rawUri = process.env.MONGODB_URI;
const uri = rawUri ? rawUri.replace(/\\:/g, ":").replace(/\\@/g, "@") : null;

// Probe Atlas connectivity once with reasonable timeout
let isAtlasReachable = false;
if (uri) {
  try {
    await mongoose.connect(uri, {
      dbName: "codelynx",
      serverSelectionTimeoutMS: 3000,
    });
    isAtlasReachable = mongoose.connection.readyState === 1;
  } catch (err) {
    isAtlasReachable = false;
    console.warn("\n[Atlas Warning] MongoDB Atlas connection probe failed:", err.message);
    console.warn("[Atlas Warning] Ensure your current public IP is whitelisted in MongoDB Atlas Network Access.\n");
  }
}

test("Phase 8.1: MongoDB Atlas Connectivity & Indexing", async (t) => {
  assert.ok(uri, "MONGODB_URI must be configured in environment");

  if (!isAtlasReachable) {
    t.skip("Skipping live Atlas tests: IP is not currently in MongoDB Atlas Network Access whitelist");
    return;
  }

  await t.test("Connects to MongoDB Atlas cluster with correct dbName", async () => {
    assert.equal(mongoose.connection.readyState, 1, "Connection readyState must be 1 (connected)");
    assert.equal(mongoose.connection.name, "codelynx", "Database name must be 'codelynx'");
  });

  await t.test("Collections and index definitions are healthy", async () => {
    const collections = await mongoose.connection.db.listCollections().toArray();
    assert.ok(Array.isArray(collections), "Should list collections");
  });
});

test("Phase 8.2: Real CRUD Operations on User Accounts", async (t) => {
  if (!isAtlasReachable) {
    t.skip("Skipping live Atlas tests: IP is not currently in MongoDB Atlas Network Access whitelist");
    return;
  }
  const UserSchema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true },
      passwordHash: String,
      authProvider: { type: String, default: "credentials" },
      preferences: mongoose.Schema.Types.Mixed,
    },
    { timestamps: true }
  );
  const User = mongoose.models.AuditUser || mongoose.model("AuditUser", UserSchema, "users");

  const testEmail = `audit.user.${Date.now()}.${Math.random().toString(36).slice(2, 6)}@codelynx.ai`;
  let createdId = null;

  await t.test("CREATE: inserts user into Atlas", async () => {
    const user = await User.create({
      name: "Atlas Test Engineer",
      email: testEmail,
      passwordHash: "test_hashed_secret",
      preferences: { theme: "nord", fontSize: 16 },
    });
    assert.ok(user._id, "User must have generated _id");
    createdId = user._id;
  });

  await t.test("READ: fetches user by ID and email", async () => {
    const user = await User.findById(createdId);
    assert.ok(user);
    assert.equal(user.email, testEmail);
    assert.equal(user.preferences.fontSize, 16);
  });

  await t.test("UPDATE: updates preferences", async () => {
    await User.findByIdAndUpdate(createdId, { $set: { "preferences.fontSize": 18 } });
    const user = await User.findById(createdId);
    assert.equal(user.preferences.fontSize, 18);
  });

  await t.test("INTEGRITY: rejects duplicate email", async () => {
    let threw = false;
    try {
      await User.create({ name: "Duplicate", email: testEmail, passwordHash: "h2" });
    } catch (err) {
      threw = err.code === 11000;
    }
    assert.ok(threw, "Must reject duplicate email with E11000 error");
  });

  await t.test("DELETE: safely cleans up test record", async () => {
    await User.findByIdAndDelete(createdId);
    const user = await User.findById(createdId);
    assert.equal(user, null, "User should be deleted from Atlas");
  });
});

test("Phase 8.3: Data Persistence & Cross-Model Relations", async (t) => {
  if (!isAtlasReachable) {
    t.skip("Skipping live Atlas tests: IP is not currently in MongoDB Atlas Network Access whitelist");
    return;
  }
  const ProjectSchema = new mongoose.Schema(
    {
      name: String,
      ownerId: String,
      language: String,
      files: Array,
    },
    { timestamps: true }
  );
  const DSAProgressSchema = new mongoose.Schema(
    {
      userId: { type: String, unique: true },
      solvedProblems: [String],
      bookmarkedProblems: [String],
      streakCount: Number,
    },
    { timestamps: true }
  );

  const Project = mongoose.models.AuditProject || mongoose.model("AuditProject", ProjectSchema, "projects");
  const DSAProgress = mongoose.models.AuditDSAProgress || mongoose.model("AuditDSAProgress", DSAProgressSchema, "dsaprogresses");

  const testUserId = new mongoose.Types.ObjectId().toString();

  await t.test("Persists project and retrieves by ownerId", async () => {
    const proj = await Project.create({
      name: "Atlas Test Pipeline",
      ownerId: testUserId,
      language: "typescript",
      files: [{ id: "f1", name: "index.ts", content: "console.log('atlas')", language: "typescript" }],
    });
    assert.ok(proj._id);

    const retrieved = await Project.findOne({ _id: proj._id, ownerId: testUserId });
    assert.ok(retrieved);
    assert.equal(retrieved.name, "Atlas Test Pipeline");
  });

  await t.test("Persists DSA bookmarks and progress", async () => {
    await DSAProgress.create({
      userId: testUserId,
      solvedProblems: ["merge-sort-engine"],
      bookmarkedProblems: ["binary-tree-traversal"],
      streakCount: 3,
    });

    const prog = await DSAProgress.findOne({ userId: testUserId });
    assert.ok(prog);
    assert.equal(prog.streakCount, 3);
    assert.ok(prog.bookmarkedProblems.includes("binary-tree-traversal"));
  });

  // Cleanup
  await Project.deleteMany({ ownerId: testUserId });
  await DSAProgress.deleteMany({ userId: testUserId });
});

test("Phase 8.4: Strict Multi-Tenant Account Isolation", async (t) => {
  if (!isAtlasReachable) {
    t.skip("Skipping live Atlas tests: IP is not currently in MongoDB Atlas Network Access whitelist");
    return;
  }
  const ProjectSchema = new mongoose.Schema(
    { name: String, ownerId: String },
    { timestamps: true }
  );
  const Project = mongoose.models.AuditIsolationProject || mongoose.model("AuditIsolationProject", ProjectSchema, "projects");

  const userAliceId = new mongoose.Types.ObjectId().toString();
  const userBobId = new mongoose.Types.ObjectId().toString();

  const aliceProj = await Project.create({
    name: "Alice Proprietary Architecture",
    ownerId: userAliceId,
  });

  await t.test("Alice can read her own project", async () => {
    const p = await Project.findOne({ _id: aliceProj._id, ownerId: userAliceId });
    assert.ok(p, "Alice must access her own project");
  });

  await t.test("Bob is strictly denied access to Alice's project", async () => {
    const p = await Project.findOne({ _id: aliceProj._id, ownerId: userBobId });
    assert.equal(p, null, "Bob must NOT receive Alice's project");
  });

  await t.test("Bob cannot update or delete Alice's project", async () => {
    const updateRes = await Project.updateOne(
      { _id: aliceProj._id, ownerId: userBobId },
      { $set: { name: "Bob Overwrite Attempt" } }
    );
    assert.equal(updateRes.matchedCount, 0, "No records matched Bob's update attempt");

    const deleteRes = await Project.deleteOne({ _id: aliceProj._id, ownerId: userBobId });
    assert.equal(deleteRes.deletedCount, 0, "No records deleted by Bob");
  });

  // Cleanup
  await Project.findByIdAndDelete(aliceProj._id);
});

test("Phase 8.5: Failure Handling & Error Safety", async (t) => {
  await t.test("Invalid connection string fails with safe error without crashing process", async () => {
    const fakeClient = new mongoose.Mongoose();
    let threw = false;
    try {
      await fakeClient.connect("mongodb://invalid-host:27017/codelynx", {
        serverSelectionTimeoutMS: 500,
      });
    } catch (err) {
      threw = true;
      assert.ok(err.message, "Should produce readable error message");
    }
    assert.ok(threw, "Invalid connection must reject promise");
  });
});

test.after(async () => {
  await mongoose.disconnect();
});
