-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "watchLat" REAL,
    "watchLon" REAL,
    "watchRadius" INTEGER NOT NULL DEFAULT 25,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FcmToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "device" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FcmToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sighting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "callsign" TEXT,
    "aircraftType" TEXT,
    "airline" TEXT,
    "altitude" INTEGER,
    "speed" REAL,
    "lat" REAL NOT NULL,
    "lon" REAL NOT NULL,
    "heading" REAL,
    "distance" REAL NOT NULL,
    "seenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sighting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "notifyMilitary" BOOLEAN NOT NULL DEFAULT true,
    "notifyHelicopters" BOOLEAN NOT NULL DEFAULT true,
    "notifyAboveAlt" INTEGER,
    "notifyBelowAlt" INTEGER,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "unitSystem" TEXT NOT NULL DEFAULT 'imperial',
    CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FcmToken_token_key" ON "FcmToken"("token");

-- CreateIndex
CREATE INDEX "Sighting_userId_seenAt_idx" ON "Sighting"("userId", "seenAt");

-- CreateIndex
CREATE INDEX "Sighting_hex_idx" ON "Sighting"("hex");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_key" ON "Preference"("userId");
