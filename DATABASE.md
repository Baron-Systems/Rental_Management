# تصميم قاعدة البيانات - نظام إدارة إيجارات العمارات

## نظرة عامة

قاعدة بيانات PostgreSQL مع Prisma ORM. جميع الجداول مرتبطة بالمتطلبات الواردة في `requirements.md`.

## الجداول

### 1. users (المستخدمون)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| name | VARCHAR(100) | NOT NULL | الاسم |
| email | VARCHAR(100) | UNIQUE, NOT NULL | البريد الإلكتروني |
| password_hash | VARCHAR(255) | NOT NULL | كلمة المرور مشفرة |
| is_active | BOOLEAN | DEFAULT true | نشط/معطل |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

### 2. buildings (العمارات)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| name | VARCHAR(100) | NOT NULL | اسم العمارة |
| owner_name | VARCHAR(100) | | اسم المالك |
| address | VARCHAR(255) | | العنوان |
| latitude | DECIMAL(10,8) | | خط العرض |
| longitude | DECIMAL(11,8) | | خط الطول |
| floors_count | INT | DEFAULT 0 | عدد الطوابق |
| units_count | INT | DEFAULT 0 | عدد الوحدات |
| is_active | BOOLEAN | DEFAULT true | نشط/معطل |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

### 3. floors (الطوابق)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| building_id | UUID | FK → buildings.id, NOT NULL | العمارة |
| name | VARCHAR(50) | NOT NULL | اسم الطابق |
| sort_order | INT | DEFAULT 0 | ترتيب العرض |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

**Constraints:**
- UNIQUE(building_id, name) - لا تكرار اسم الطابق في العمارة
- FOREIGN KEY building_id ON DELETE RESTRICT

### 4. units (الوحدات)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| building_id | UUID | FK → buildings.id, NOT NULL | العمارة |
| floor_id | UUID | FK → floors.id, NULL | الطابق |
| unit_number | VARCHAR(50) | NOT NULL | رقم/اسم الوحدة |
| unit_type | VARCHAR(30) | NOT NULL | نوع الوحدة |
| area | DECIMAL(10,2) | | المساحة |
| rooms_count | INT | | عدد الغرف |
| bathrooms_count | INT | | عدد الحمامات |
| default_rent | DECIMAL(12,2) | | قيمة الإيجار الافتراضية |
| electricity_meter_number | VARCHAR(50) | | رقم عداد الكهرباء |
| water_meter_number | VARCHAR(50) | | رقم عداد المياه |
| status | VARCHAR(20) | DEFAULT 'empty' | الحالة |
| notes | TEXT | | الملاحظات |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

**Constraints:**
- UNIQUE(building_id, unit_number) - لا تكرار رقم الوحدة في العمارة
- CHECK(status IN ('empty', 'rented', 'reserved', 'unavailable'))
- FOREIGN KEY building_id ON DELETE RESTRICT
- FOREIGN KEY floor_id ON DELETE SET NULL

### 5. tenants (المستأجرين)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| full_name | VARCHAR(100) | NOT NULL | الاسم الكامل |
| national_id | VARCHAR(50) | | رقم الهوية |
| phone | VARCHAR(20) | | رقم الهاتف |
| email | VARCHAR(100) | | البريد الإلكتروني |
| address | VARCHAR(255) | | العنوان |
| workplace | VARCHAR(100) | | جهة العمل |
| guarantor_name | VARCHAR(100) | | اسم الكفيل |
| guarantor_phone | VARCHAR(20) | | رقم هاتف الكفيل |
| identity_image | VARCHAR(255) | | صورة الهوية |
| notes | TEXT | | الملاحظات |
| is_active | BOOLEAN | DEFAULT true | نشط/معطل |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

**Indexes:**
- national_id (unique optionally based on settings)
- phone
- full_name

### 6. lease_contracts (عقود الإيجار)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| contract_number | VARCHAR(50) | NOT NULL | رقم العقد |
| tenant_id | UUID | FK → tenants.id, NOT NULL | المستأجر |
| building_id | UUID | FK → buildings.id, NOT NULL | العمارة |
| unit_id | UUID | FK → units.id, NOT NULL | الوحدة |
| previous_contract_id | UUID | FK → lease_contracts.id, NULL | العقد السابق |
| start_date | DATE | NOT NULL | تاريخ البداية |
| end_date | DATE | NOT NULL | تاريخ النهاية |
| rent_amount | DECIMAL(12,2) | NOT NULL | قيمة الإيجار |
| payment_frequency | VARCHAR(20) | NOT NULL | دورية الإيجار |
| payment_method | VARCHAR(50) | | طريقة الدفع |
| electricity_responsibility | VARCHAR(50) | | مسؤولية الكهرباء |
| water_responsibility | VARCHAR(50) | | مسؤولية المياه |
| terms | TEXT | | شروط العقد |
| witnesses | TEXT | | الشهود أو الكفيل |
| status | VARCHAR(20) | DEFAULT 'draft' | الحالة |
| notes | TEXT | | الملاحظات |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

**Constraints:**
- CHECK(end_date > start_date)
- CHECK(rent_amount > 0)
- CHECK(status IN ('draft', 'active', 'expired', 'cancelled', 'evicted', 'renewed'))
- CHECK(payment_frequency IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'one_time'))
- FOREIGN KEY unit_id ON DELETE RESTRICT

**Indexes:**
- unit_id + status
- tenant_id + status
- start_date + end_date
- contract_number (UNIQUE)

### 7. due_types (أنواع الاستحقاقات)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| name | VARCHAR(50) | NOT NULL | الاسم |
| is_system | BOOLEAN | DEFAULT false | نظامي/مخصص |
| is_active | BOOLEAN | DEFAULT true | نشط/معطل |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

**Seed Data:**
- إيجار, كهرباء, مياه, نظافة, خدمات, مصعد, رسوم مشتركة, إصلاح, رصيد افتتاحي, مبلغ إضافي, أخرى

### 8. dues (الاستحقاقات)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| due_number | VARCHAR(50) | NOT NULL | رقم الاستحقاق |
| tenant_id | UUID | FK → tenants.id, NOT NULL | المستأجر |
| contract_id | UUID | FK → lease_contracts.id, NULL | العقد |
| building_id | UUID | FK → buildings.id, NULL | العمارة |
| unit_id | UUID | FK → units.id, NULL | الوحدة |
| due_type_id | UUID | FK → due_types.id, NOT NULL | نوع الاستحقاق |
| transaction_date | DATE | NOT NULL | تاريخ الإنشاء |
| due_date | DATE | NOT NULL | تاريخ الاستحقاق |
| period_label | VARCHAR(50) | | الفترة المرتبطة |
| description | TEXT | | الوصف |
| amount | DECIMAL(12,2) | NOT NULL | المبلغ |
| source_type | VARCHAR(30) | NOT NULL | مصدر الإنشاء |
| reference_number | VARCHAR(50) | | رقم المرجع |
| status | VARCHAR(20) | DEFAULT 'approved' | الحالة الإدارية |
| cancellation_reason | TEXT | | سبب الإلغاء |
| cancelled_by | UUID | FK → users.id, NULL | ألغى بواسطة |
| cancelled_at | TIMESTAMPTZ | NULL | تاريخ الإلغاء |
| notes | TEXT | | الملاحظات |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

**Constraints:**
- CHECK(amount > 0)
- CHECK(status IN ('approved', 'cancelled'))
- CHECK(source_type IN ('auto_contract', 'manual', 'opening_balance', 'eviction', 'adjustment'))
- FOREIGN KEY tenant_id ON DELETE RESTRICT

**Indexes:**
- tenant_id + status + created_at
- contract_id + status
- due_date + status
- due_type_id + status
- transaction_date

### 9. receipts (سندات القبض)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| receipt_number | VARCHAR(50) | NOT NULL | رقم السند |
| tenant_id | UUID | FK → tenants.id, NOT NULL | المستأجر |
| contract_id | UUID | FK → lease_contracts.id, NULL | العقد |
| building_id | UUID | FK → buildings.id, NULL | العمارة |
| unit_id | UUID | FK → units.id, NULL | الوحدة |
| receipt_date | DATE | NOT NULL | التاريخ |
| amount | DECIMAL(12,2) | NOT NULL | المبلغ |
| payment_method | VARCHAR(20) | NOT NULL | طريقة الدفع |
| reference_number | VARCHAR(50) | | رقم المرجع |
| cheque_image | VARCHAR(255) | | صورة الشيك |
| status | VARCHAR(20) | DEFAULT 'approved' | الحالة الإدارية |
| cancellation_reason | TEXT | | سبب الإلغاء |
| cancelled_by | UUID | FK → users.id, NULL | ألغى بواسطة |
| cancelled_at | TIMESTAMPTZ | NULL | تاريخ الإلغاء |
| notes | TEXT | | الملاحظات |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

**Constraints:**
- CHECK(amount > 0)
- CHECK(status IN ('approved', 'cancelled'))
- CHECK(payment_method IN ('cash', 'cheque'))
- FOREIGN KEY tenant_id ON DELETE RESTRICT

**Indexes:**
- tenant_id + status + receipt_date
- receipt_date + status
- contract_id + status

### 10. evictions (عمليات الإخلاء)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| contract_id | UUID | FK → lease_contracts.id, NOT NULL | العقد |
| tenant_id | UUID | FK → tenants.id, NOT NULL | المستأجر |
| unit_id | UUID | FK → units.id, NOT NULL | الوحدة |
| eviction_date | DATE | NOT NULL | تاريخ الإخلاء |
| electricity_meter_reading | VARCHAR(50) | | قراءة عداد الكهرباء |
| water_meter_reading | VARCHAR(50) | | قراءة عداد المياه |
| notes | TEXT | | الملاحظات |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

### 11. settings (الإعدادات)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| setting_key | VARCHAR(100) | UNIQUE, NOT NULL | مفتاح الإعداد |
| setting_value | JSONB | | قيمة الإعداد |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |
| updated_at | TIMESTAMPTZ | DEFAULT now() | تاريخ التحديث |

### 12. activity_logs (سجل العمليات)

| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | UUID | PK | المعرف |
| user_id | UUID | FK → users.id | المستخدم |
| action_type | VARCHAR(50) | NOT NULL | نوع العملية |
| entity_type | VARCHAR(50) | NOT NULL | نوع الكيان |
| entity_id | UUID | | المعرف |
| old_values | JSONB | | القيم القديمة |
| new_values | JSONB | | القيم الجديدة |
| created_at | TIMESTAMPTZ | DEFAULT now() | تاريخ الإنشاء |

**Indexes:**
- entity_type + entity_id
- action_type + created_at
- user_id + created_at

## العلاقات (ER Diagram)

```
users
  │
  ├── activity_logs (1:N)
  ├── dues.cancelled_by (1:N)
  └── receipts.cancelled_by (1:N)

buildings
  │
  ├── floors (1:N)
  ├── units (1:N)
  ├── lease_contracts (1:N)
  ├── dues (1:N)
  └── receipts (1:N)

floors
  │
  └── units (1:N)

units
  │
  ├── lease_contracts (1:N)
  ├── dues (1:N)
  ├── receipts (1:N)
  └── evictions (1:N)

tenants
  │
  ├── lease_contracts (1:N)
  ├── dues (1:N)
  ├── receipts (1:N)
  └── evictions (1:N)

lease_contracts
  │
  ├── previous_contract_id (1:1 self)
  ├── dues (1:N)
  ├── receipts (1:N)
  └── evictions (1:N)

due_types
  │
  └── dues (1:N)
```

## الفهارس المقترحة للأداء

```sql
-- Buildings
CREATE INDEX idx_buildings_is_active ON buildings(is_active);

-- Floors
CREATE INDEX idx_floors_building_id ON floors(building_id);
CREATE INDEX idx_floors_sort_order ON floors(sort_order);

-- Units
CREATE INDEX idx_units_building_id ON units(building_id);
CREATE INDEX idx_units_floor_id ON units(floor_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_building_status ON units(building_id, status);

-- Tenants
CREATE INDEX idx_tenants_national_id ON tenants(national_id);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_tenants_full_name ON tenants(full_name);

-- Lease Contracts
CREATE INDEX idx_contracts_unit_id ON lease_contracts(unit_id);
CREATE INDEX idx_contracts_tenant_id ON lease_contracts(tenant_id);
CREATE INDEX idx_contracts_status ON lease_contracts(status);
CREATE INDEX idx_contracts_dates ON lease_contracts(start_date, end_date);
CREATE INDEX idx_contracts_unit_status ON lease_contracts(unit_id, status);
CREATE INDEX idx_contracts_number ON lease_contracts(contract_number);

-- Dues
CREATE INDEX idx_dues_tenant_id ON dues(tenant_id);
CREATE INDEX idx_dues_contract_id ON dues(contract_id);
CREATE INDEX idx_dues_due_date ON dues(due_date);
CREATE INDEX idx_dues_status ON dues(status);
CREATE INDEX idx_dues_tenant_status_date ON dues(tenant_id, status, created_at);
CREATE INDEX idx_dues_type ON dues(due_type_id);

-- Receipts
CREATE INDEX idx_receipts_tenant_id ON receipts(tenant_id);
CREATE INDEX idx_receipts_receipt_date ON receipts(receipt_date);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_tenant_status_date ON receipts(tenant_id, status, receipt_date);

-- Activity Logs
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_logs_user ON activity_logs(user_id, created_at DESC);
```

## Constraints على مستوى قاعدة البيانات

```sql
-- منع العقود المتداخلة للوحدة الواحدة (trigger أو application-level)
-- لا يمكن إنشاء constraint مباشر لكن نستخدم application validation

-- فهارس Unique
ALTER TABLE buildings ADD CONSTRAINT unique_building_name UNIQUE (name);
ALTER TABLE floors ADD CONSTRAINT unique_floor_name_per_building UNIQUE (building_id, name);
ALTER TABLE units ADD CONSTRAINT unique_unit_number_per_building UNIQUE (building_id, unit_number);
ALTER TABLE lease_contracts ADD CONSTRAINT unique_contract_number UNIQUE (contract_number);
```

## Migrations

1. `0001_init` - إنشاء جميع الجداول
2. `0002_seed_due_types` - إدخال أنواع الاستحقاقات الافتراضية
3. `0003_add_indexes` - إضافة الفهارس
4. `0004_add_constraints` - إضافة القيود الإضافية

## ملاحظات التصميم

1. **لا يوجد حقل balance في جدول tenants**: الرصيد يحسب من الحركات
2. **لا يوجد حقل paid_amount في dues**: ممنوع توزيع الدفعات
3. **لا يوجد حقل status مالي**: فقط حالة إدارية (approved/cancelled)
4. **contract_id اختياري في dues**: للاستحقاقات المستقلة عن العقود
5. **cancelled_by و cancelled_at**: لتتبع الإلغاءات
6. **activity_logs**: JSONB للقيم القديمة والجديدة
