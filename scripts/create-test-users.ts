import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { nanoid } from "nanoid";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUsers() {
  console.log("Creating test users...\n");

  const testUsers = [
    {
      username: "premium_user",
      email: "premium@test.com",
      password: "premium123",
      numericPassword: "1234",
      phone: "+1234567890",
      fullName: "Premium User",
      subscriptionType: "premium",
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
    {
      username: "free_user1",
      email: "free1@test.com",
      password: "free123",
      numericPassword: "5678",
      phone: "+1234567891",
      fullName: "Free User One",
      subscriptionType: "free",
      subscriptionExpiresAt: null,
    },
    {
      username: "free_user2",
      email: "free2@test.com",
      password: "free123",
      numericPassword: "9012",
      phone: "+1234567892",
      fullName: "Free User Two",
      subscriptionType: "free",
      subscriptionExpiresAt: null,
    },
  ];

  for (const user of testUsers) {
    try {
      const hashedPassword = await hashPassword(user.password);
      const hashedNumericPassword = await hashPassword(user.numericPassword);
      const userCode = nanoid(8).toUpperCase();

      await db.insert(users).values({
        username: user.username,
        email: user.email,
        password: hashedPassword,
        numericPassword: hashedNumericPassword,
        phone: user.phone,
        fullName: user.fullName,
        userCode: userCode,
        isSetupComplete: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        subscriptionType: user.subscriptionType,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      });

      console.log(`✅ Created ${user.subscriptionType} user:`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Calculator PIN: ${user.numericPassword}`);
      console.log(`   User Code: ${userCode}`);
      console.log(`   Subscription: ${user.subscriptionType}`);
      console.log();
    } catch (error: any) {
      if (error.code === "23505") {
        console.log(`⚠️  User ${user.username} already exists, skipping...`);
      } else {
        console.error(`❌ Error creating ${user.username}:`, error.message);
      }
    }
  }

  console.log("Done!");
  process.exit(0);
}

createTestUsers().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
