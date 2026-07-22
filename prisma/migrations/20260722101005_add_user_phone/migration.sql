/*
  Warnings:

  - You are about to drop the column `cancellation_reason` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `cancelled_at` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `cancelled_by` on the `receipts` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `receipts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "dues" DROP CONSTRAINT "dues_cancelled_by_fkey";

-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_cancelled_by_fkey";

-- AlterTable
ALTER TABLE "lease_contracts" ADD COLUMN     "commitment_timing" VARCHAR(20) DEFAULT 'start',
ADD COLUMN     "contract_date" DATE,
ADD COLUMN     "first_due_date" DATE,
ADD COLUMN     "maintenance_responsibility" VARCHAR(50),
ADD COLUMN     "services_responsibility" VARCHAR(50);

-- AlterTable
ALTER TABLE "receipts" DROP COLUMN "cancellation_reason",
DROP COLUMN "cancelled_at",
DROP COLUMN "cancelled_by",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "current_electricity_meter_reading" VARCHAR(50),
ADD COLUMN     "current_water_meter_reading" VARCHAR(50);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" VARCHAR(20);

-- CreateTable
CREATE TABLE "contract_attachments" (
    "id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "fileData" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- AddForeignKey
ALTER TABLE "contract_attachments" ADD CONSTRAINT "contract_attachments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "lease_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
