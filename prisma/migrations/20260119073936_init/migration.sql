-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "clientIp" TEXT,
    "userAgent" TEXT,
    "requestBody" JSONB,
    "responseCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "queryText" TEXT,
    "chunksUsed" INTEGER,
    "noteLength" INTEGER,
    "findingsCount" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_endpoint_idx" ON "AuditLog"("endpoint");

-- CreateIndex
CREATE INDEX "AuditLog_clientIp_idx" ON "AuditLog"("clientIp");
