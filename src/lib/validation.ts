import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'البريد الإلكتروني أو رقم الهاتف مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const buildingSchema = z.object({
  name: z.string().min(1, 'اسم العمارة مطلوب').max(100),
  ownerName: z.string().max(100).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  floorsCount: z.number().int().min(0).optional().nullable(),
  unitsCount: z.number().int().min(0).optional().nullable(),
});

export const floorSchema = z.object({
  buildingId: z.string().uuid('معرف العمارة مطلوب'),
  name: z.string().min(1, 'اسم الطابق مطلوب').max(50),
  sortOrder: z.number().int().default(0),
});

const nullableMeterReading = z.preprocess(
  (value) => {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    const str = String(value).trim();
    if (str === '') return null;
    const num = Number(str);
    if (Number.isNaN(num)) return null;
    return str;
  },
  z.string().max(50).nullable()
);

export const unitSchema = z.object({
  buildingId: z.string().uuid('معرف العمارة مطلوب'),
  floorId: z.string().uuid().optional().nullable(),
  unitNumber: z.string().min(1, 'رقم الوحدة مطلوب').max(50),
  unitType: z.string().min(1, 'نوع الوحدة مطلوب').max(30),
  area: z.string().optional().nullable(),
  roomsCount: z.number().int().min(0).optional().nullable(),
  bathroomsCount: z.number().int().min(0).optional().nullable(),
  defaultRent: z.string().optional().nullable(),
  electricityMeterNumber: z.string().max(50).optional().nullable(),
  waterMeterNumber: z.string().max(50).optional().nullable(),
  currentElectricityMeterReading: nullableMeterReading,
  currentWaterMeterReading: nullableMeterReading,
  status: z.enum(['empty', 'rented', 'reserved', 'unavailable']).default('empty'),
  notes: z.string().optional().nullable(),
});

export const tenantSchema = z.object({
  fullName: z.string().min(1, 'الاسم الكامل مطلوب').max(100),
  nationalId: z.string().max(50).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
  address: z.string().max(255).optional().nullable(),
  workplace: z.string().max(100).optional().nullable(),
  guarantorName: z.string().max(100).optional().nullable(),
  guarantorPhone: z.string().max(20).optional().nullable(),
  notes: z.string().optional().nullable(),
});

const baseContractSchema = z.object({
  tenantId: z.string().uuid('المستأجر مطلوب'),
  buildingId: z.string().uuid('العمارة مطلوبة'),
  unitId: z.string().uuid('الوحدة مطلوبة'),
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
  rentAmount: z.string().min(1, 'قيمة الإيجار مطلوبة'),
  paymentFrequency: z.string().min(1, 'دورية الدفع مطلوبة'),
  paymentMethod: z.string().optional().nullable(),
  electricityResponsibility: z.string().optional().nullable(),
  waterResponsibility: z.string().optional().nullable(),
  maintenanceResponsibility: z.string().optional().nullable(),
  servicesResponsibility: z.string().optional().nullable(),
  commitmentTiming: z.string().optional().nullable(),
  contractDate: z.string().optional().nullable(),
  firstDueDate: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  witnesses: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'expired', 'cancelled', 'evicted']).optional(),
  previousContractId: z.string().uuid().optional().nullable(),
});

export const contractSchema = baseContractSchema.refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
  path: ['endDate'],
}).refine((data) => {
  const amount = parseFloat(data.rentAmount);
  return !isNaN(amount) && amount > 0;
}, {
  message: 'قيمة الإيجار يجب أن تكون أكبر من صفر',
  path: ['rentAmount'],
});

export const contractUpdateSchema = baseContractSchema.partial().refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start < end;
  }
  return true;
}, {
  message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
  path: ['endDate'],
}).refine((data) => {
  if (data.rentAmount) {
    const amount = parseFloat(data.rentAmount);
    return !isNaN(amount) && amount > 0;
  }
  return true;
}, {
  message: 'قيمة الإيجار يجب أن تكون أكبر من صفر',
  path: ['rentAmount'],
});

export const dueSchema = z.object({
  tenantId: z.string().uuid('المستأجر مطلوب'),
  unitId: z.string().uuid('الوحدة مطلوبة'),
  dueTypeId: z.string().uuid('نوع الالتزام مطلوب'),
  dueDate: z.string().min(1, 'تاريخ الالتزام مطلوب'),
  amount: z.string().min(1, 'المبلغ مطلوب'),
  description: z.string().optional().nullable(),
  previousMeterReading: z.string().optional().nullable(),
  currentMeterReading: z.string().optional().nullable(),
  meterConsumption: z.string().optional().nullable(),
  unitPrice: z.string().optional().nullable(),
}).refine((data) => {
  const amount = parseFloat(data.amount);
  return !isNaN(amount) && amount > 0;
}, {
  message: 'المبلغ يجب أن يكون أكبر من صفر',
  path: ['amount'],
});

export const dueUpdateSchema = z.object({
  unitId: z.string().uuid().optional(),
  dueTypeId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  amount: z.string().optional(),
  description: z.string().optional().nullable(),
  previousMeterReading: z.string().optional().nullable(),
  currentMeterReading: z.string().optional().nullable(),
  meterConsumption: z.string().optional().nullable(),
  unitPrice: z.string().optional().nullable(),
}).refine((data) => {
  if (data.amount) {
    const amount = parseFloat(data.amount);
    return !isNaN(amount) && amount > 0;
  }
  return true;
}, {
  message: 'المبلغ يجب أن يكون أكبر من صفر',
  path: ['amount'],
});

export const receiptSchema = z.object({
  tenantId: z.string().uuid('المستأجر مطلوب'),
  contractId: z.string().uuid().optional().nullable(),
  buildingId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  receiptDate: z.string().min(1, 'تاريخ السند مطلوب'),
  amount: z.string().min(1, 'المبلغ مطلوب'),
  paymentMethod: z.enum(['cash', 'cheque']),
  referenceNumber: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => {
  const amount = parseFloat(data.amount);
  return !isNaN(amount) && amount > 0;
}, {
  message: 'المبلغ يجب أن يكون أكبر من صفر',
  path: ['amount'],
});

export const cancellationSchema = z.object({
  reason: z.string().min(1, 'سبب الإلغاء مطلوب'),
});
