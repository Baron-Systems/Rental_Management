-- AlterTable
ALTER TABLE "dues" ADD COLUMN     "previous_meter_reading" VARCHAR(50),
ADD COLUMN     "current_meter_reading" VARCHAR(50),
ADD COLUMN     "meter_consumption" VARCHAR(50),
ADD COLUMN     "unit_price" DECIMAL(12, 2);
