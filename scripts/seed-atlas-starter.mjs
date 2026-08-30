import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import mongoose from "mongoose";

async function seedStarter() {
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri) {
    console.error("MONGODB_URI missing.");
    process.exit(1);
  }
  const uri = rawUri.replace(/\\:/g, ":").replace(/\\@/g, "@");

  await mongoose.connect(uri, { dbName: "codelynx" });
  console.log("Connected to Atlas for idempotent starter check.");

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

  const ProjectSchema = new mongoose.Schema(
    {
      name: String,
      description: String,
      ownerId: String,
      language: String,
      files: Array,
      activeFileId: String,
      tags: [String],
    },
    { timestamps: true }
  );

  const User = mongoose.models.User || mongoose.model("User", UserSchema, "users");
  const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema, "projects");

  const demoEmail = "demo@codelynx.ai";
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    console.log("Seeding demo developer account into Atlas...");
    demoUser = await User.create({
      name: "Alex Lynx (Staff Engineer)",
      email: demoEmail,
      // Bcrypt hash for 'Password123!'
      passwordHash: "$2a$10$v7m2yE6eS8u6bVl6W.9Rse2o8kQ4uW5wW7M2u9N9jT5k1bZk9q2mO",
      authProvider: "credentials",
      preferences: {
        theme: "codelynx-dark",
        defaultLanguage: "python",
        fontSize: 14,
        minimap: true,
        wordWrap: true,
        aiModel: "gemini-3.5-flash",
        verbosity: "balanced",
      },
    });
    console.log("  ✔ Demo account created in Atlas with ID:", demoUser._id.toString());
  } else {
    console.log("  ✔ Demo developer account already exists in Atlas (ID:", demoUser._id.toString(), ")");
  }

  const existingProjects = await Project.countDocuments({ ownerId: demoUser._id.toString() });
  if (existingProjects === 0) {
    console.log("Seeding starter projects for demo developer...");
    await Project.create({
      name: "Two-Sum Hash Map Solution",
      description: "Optimized two-pointer and hash table lookup with O(n) complexity",
      ownerId: demoUser._id.toString(),
      language: "python",
      files: [
        {
          id: "f_1",
          name: "main.py",
          language: "python",
          content: `def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []

if __name__ == "__main__":
    nums = [2, 7, 11, 15]
    target = 9
    print("Found indices:", two_sum(nums, target))
`,
        },
      ],
      activeFileId: "f_1",
      tags: ["algorithms", "arrays", "hash-map"],
    });
    console.log("  ✔ Starter project seeded successfully.");
  } else {
    console.log(`  ✔ Starter projects already present (${existingProjects} found).`);
  }

  await mongoose.disconnect();
  console.log("Database starter verification complete.");
}

seedStarter().then(() => process.exit(0)).catch((err) => {
  console.error("Seeder error:", err.message);
  process.exit(1);
});
