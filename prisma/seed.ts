import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@rental.com' },
    update: {},
    create: {
      name: 'مدير النظام',
      email: 'admin@rental.com',
      passwordHash: adminPassword,
      isActive: true,
    },
  });

  const defaultDueTypes = [
    { name: 'إيجار', isSystem: true, isActive: true },
    { name: 'كهرباء', isSystem: true, isActive: true },
    { name: 'مياه', isSystem: true, isActive: true },
    { name: 'نظافة', isSystem: true, isActive: true },
    { name: 'خدمات', isSystem: true, isActive: true },
    { name: 'مصعد', isSystem: true, isActive: true },
    { name: 'رسوم مشتركة', isSystem: true, isActive: true },
    { name: 'إصلاح يتحمله المستأجر', isSystem: true, isActive: true },
    { name: 'رصيد افتتاحي', isSystem: true, isActive: true },
    { name: 'مبلغ إضافي', isSystem: true, isActive: true },
    { name: 'أخرى', isSystem: true, isActive: true },
  ];

  for (const dt of defaultDueTypes) {
    const existing = await prisma.dueType.findFirst({ where: { name: dt.name } });
    if (!existing) {
      await prisma.dueType.create({ data: dt });
    }
  }

  const defaultSettings = [
    { settingKey: 'company_name', settingValue: { value: 'شركة إدارة المباني' } },
    { settingKey: 'company_logo', settingValue: { value: '' } },
    { settingKey: 'currency', settingValue: { value: 'ILS' } },
    { settingKey: 'date_format', settingValue: { value: 'DD/MM/YYYY' } },
    { settingKey: 'language', settingValue: { value: 'ar' } },
    { settingKey: 'landlord_name', settingValue: { value: '' } },
    { settingKey: 'landlord_id', settingValue: { value: '' } },
    { settingKey: 'landlord_phone', settingValue: { value: '' } },
    { settingKey: 'landlord_address', settingValue: { value: '' } },
    { settingKey: 'landlord_signature', settingValue: { value: '' } },
    { settingKey: 'landlord_stamp', settingValue: { value: '' } },
    { settingKey: 'default_contract_duration', settingValue: { value: 12 } },
    { settingKey: 'default_payment_frequency', settingValue: { value: 'monthly' } },
    { settingKey: 'default_payment_method', settingValue: { value: 'bank' } },
    { settingKey: 'contract_alert_days', settingValue: { value: 30 } },
    { settingKey: 'auto_approve_contract', settingValue: { value: false } },
    { settingKey: 'contract_prefix', settingValue: { value: 'CNT' } },
    { settingKey: 'contract_counter', settingValue: { value: 1 } },
    { settingKey: 'receipt_prefix', settingValue: { value: 'RCPT' } },
    { settingKey: 'receipt_counter', settingValue: { value: 1 } },
    { settingKey: 'due_prefix', settingValue: { value: 'DUE' } },
    { settingKey: 'due_counter', settingValue: { value: 1 } },
    { settingKey: 'print_header', settingValue: { value: '' } },
    { settingKey: 'print_footer', settingValue: { value: '' } },
    { settingKey: 'print_logo', settingValue: { value: true } },
    { settingKey: 'show_due_schedule', settingValue: { value: true } },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { settingKey: s.settingKey },
      update: {},
      create: { settingKey: s.settingKey, settingValue: s.settingValue },
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
