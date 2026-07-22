# خطة التنفيذ - نظام إدارة إيجارات العمارات

## نظرة عامة

بناء نظام إدارة إيجارات كامل بناءً على `requirements.md` كمصدر وحيد للحقيقة.

## التقنية المستخدمة

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (Full Stack)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: iron-session + bcrypt
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx

---

## المراحل التنفيذية

### المرحلة 1: التوثيق والتصميم (أولوية عالية)

| الملف | الوصف |
|-------|-------|
| `README.md` | نظرة عامة على المشروع، التشغيل، المتطلبات |
| `ARCHITECTURE.md` | معمارية النظام، طبقات التطبيق، تدفق البيانات |
| `DATABASE.md` | تصميم قاعدة البيانات، الجداول، العلاقات، الفهارس |
| `BUSINESS_RULES.md` | القواعد المالية، قواعد الأعمال، القيود |
| `IMPLEMENTATION_PLAN.md` | هذا الملف - خطة التنفيذ التفصيلية |

### المرحلة 2: إعداد البنية التحتية (أولوية عالية)

1. تهيئة مشروع Next.js مع TypeScript
2. تثبيت Prisma وإعداد اتصال PostgreSQL
3. تثبيت الاعتماديات: Tailwind, shadcn/ui, iron-session, bcrypt, date-fns
4. إعداد Docker + Docker Compose
5. إعداد Nginx reverse proxy

### المرحلة 3: قاعدة البيانات (أولوية عالية)

1. تعريف Prisma Schema لجميع الجداول:
   - `users` - المستخدمون
   - `buildings` - العمارات
   - `floors` - الطوابق
   - `units` - الوحدات
   - `tenants` - المستأجرين
   - `lease_contracts` - عقود الإيجار
   - `due_types` - أنواع الاستحقاقات
   - `dues` - الاستحقاقات
   - `receipts` - سندات القبض
   - `evictions` - عمليات الإخلاء
   - `settings` - الإعدادات
   - `activity_logs` - سجل العمليات
2. إنشاء migrations أولية
3. إضافة الفهارس والقيود
4. إضافة seed data للأنواع الافتراضية

### المرحلة 4: Backend - API Routes (أولوية عالية)

#### Authentication
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `GET /api/auth/me` - المستخدم الحالي
- `POST /api/auth/change-password` - تغيير كلمة المرور

#### Buildings
- `GET /api/buildings` - قائمة العمارات
- `POST /api/buildings` - إنشاء عمارة
- `GET /api/buildings/[id]` - تفاصيل العمارة
- `PUT /api/buildings/[id]` - تعديل العمارة
- `DELETE /api/buildings/[id]` - حذف العمارة
- `GET /api/buildings/[id]/stats` - إحصائيات العمارة

#### Floors
- `GET /api/floors` - قائمة الطوابق
- `POST /api/floors` - إنشاء طابق
- `PUT /api/floors/[id]` - تعديل طابق
- `DELETE /api/floors/[id]` - حذف طابق
- `GET /api/buildings/[id]/floors` - طوابق العمارة

#### Units
- `GET /api/units` - قائمة الوحدات
- `POST /api/units` - إنشاء وحدة
- `GET /api/units/[id]` - تفاصيل الوحدة
- `PUT /api/units/[id]` - تعديل الوحدة
- `DELETE /api/units/[id]` - حذف الوحدة
- `GET /api/floors/[id]/units` - وحدات الطابق

#### Tenants
- `GET /api/tenants` - قائمة المستأجرين
- `POST /api/tenants` - إنشاء مستأجر
- `GET /api/tenants/[id]` - تفاصيل المستأجر
- `PUT /api/tenants/[id]` - تعديل المستأجر
- `DELETE /api/tenants/[id]` - حذف المستأجر
- `GET /api/tenants/[id]/balance` - رصيد المستأجر
- `GET /api/tenants/[id]/statement` - كشف حساب المستأجر

#### Contracts
- `GET /api/contracts` - قائمة العقود
- `POST /api/contracts` - إنشاء عقد
- `GET /api/contracts/[id]` - تفاصيل العقد
- `PUT /api/contracts/[id]` - تعديل العقد
- `POST /api/contracts/[id]/approve` - اعتماد العقد
- `POST /api/contracts/[id]/renew` - تجديد العقد
- `POST /api/contracts/[id]/cancel` - إلغاء العقد
- `POST /api/contracts/[id]/evict` - إخلاء الوحدة
- `DELETE /api/contracts/[id]` - حذف المسودة

#### Dues
- `GET /api/dues` - قائمة الاستحقاقات
- `POST /api/dues` - إنشاء استحقاق
- `GET /api/dues/[id]` - تفاصيل الاستحقاق
- `PUT /api/dues/[id]` - تعديل الاستحقاق
- `POST /api/dues/[id]/cancel` - إلغاء الاستحقاق
- `POST /api/dues/[id]/approve` - اعتماد الاستحقاق

#### Receipts
- `GET /api/receipts` - قائمة سندات القبض
- `POST /api/receipts` - إنشاء سند قبض
- `GET /api/receipts/[id]` - تفاصيل سند القبض
- `PUT /api/receipts/[id]` - تعديل سند القبض
- `POST /api/receipts/[id]/cancel` - إلغاء سند القبض

#### Reports
- `GET /api/reports/dues` - تقرير الاستحقاقات
- `GET /api/reports/receipts` - تقرير الدفعات
- `GET /api/reports/balances` - تقرير أرصدة المستأجرين
- `GET /api/reports/buildings-income` - تقرير دخل العمارات
- `GET /api/reports/vacant-units` - تقرير الوحدات الفارغة
- `GET /api/reports/occupied-units` - تقرير الوحدات المؤجرة
- `GET /api/reports/contracts` - تقرير العقود

#### Dashboard
- `GET /api/dashboard` - بيانات لوحة التحكم
- `GET /api/dashboard/charts` - بيانات الرسوم البيانية
- `GET /api/dashboard/alerts` - التنبيهات

#### Settings
- `GET /api/settings` - الإعدادات
- `PUT /api/settings` - تحديث الإعدادات
- `GET /api/settings/due-types` - أنواع الاستحقاقات
- `POST /api/settings/due-types` - إضافة نوع استحقاق
- `PUT /api/settings/due-types/[id]` - تعديل نوع استحقاق
- `DELETE /api/settings/due-types/[id]` - حذف نوع استحقاق

#### Backups
- `POST /api/backups/create` - إنشاء نسخة احتياطية
- `GET /api/backups` - قائمة النسخ الاحتياطية
- `POST /api/backups/[id]/restore` - استعادة نسخة احتياطية
- `GET /api/backups/[id]/download` - تحميل نسخة احتياطية

### المرحلة 5: Business Logic - الخدمات (أولوية عالية)

#### Due Generation Service
- توليد استحقاقات الإيجار تلقائياً عند اعتماد العقد
- حساب الفترات بناءً على الدورية (شهرية، ربع سنوية، إلخ)
- منع التكرار عند إعادة اعتماد العقد

#### Balance Service
- حساب رصيد المستأجر: `sum(approved dues) - sum(approved receipts)`
- لا يوجد توزيع للدفعات على الاستحقاقات
- لا يوجد حالات دفع للاستحقاقات
- الرصيد يحسب فقط من الحركات المعتمدة

#### Cancellation Service
- إلغاء استحقاق معتمد مع تسجيل السبب
- إلغاء سند قبض معتمد مع تسجيل السبب
- الحركة الملغاة لا تدخل في الرصيد

#### Contract Validation Service
- منع العقود المتداخلة لنفس الوحدة
- التحقق من تاريخ البداية < تاريخ النهاية
- التحقق من قيمة الإيجار > 0

### المرحلة 6: Frontend - الصفحات (أولوية عالية)

1. **تسجيل الدخول** (`/login`) - صفحة تسجيل الدخول
2. **لوحة التحكم** (`/dashboard`) - البطاقات، الرسوم البيانية، التنبيهات
3. **العمارات** (`/buildings`) - قائمة، إضافة، تعديل، تفاصيل
4. **الطوابق** (`/floors`) - قائمة، إضافة، تعديل
5. **الوحدات** (`/units`) - قائمة، إضافة، تعديل، تفاصيل
6. **المستأجرون** (`/tenants`) - قائمة، إضافة، تعديل، ملف المستأجر
7. **العقود** (`/contracts`) - قائمة، إضافة، تعديل، تفاصيل، تجديد، إخلاء
8. **الاستحقاقات** (`/dues`) - جدول، إضافة، تفاصيل، إلغاء
9. **سندات القبض** (`/receipts`) - قائمة، إضافة، تفاصيل، إلغاء
10. **كشف الحساب** (`/tenants/[id]/statement`) - عرض، طباعة، تصدير
11. **التقارير** (`/reports`) - تقارير متعددة مع تصفية
12. **الإعدادات** (`/settings`) - إعدادات النظام، أنواع الاستحقاقات
13. **النسخ الاحتياطي** (`/backups`) - إنشاء، استعادة، تحميل

### المرحلة 7: الاختبارات (أولوية عالية)

1. **Balance Calculation Test** - اختبار حساب الرصيد
2. **Contract Due Generation Test** - اختبار توليد الاستحقاقات
3. **Duplicate Due Prevention Test** - منع تكرار الاستحقاقات
4. **Contract Overlap Prevention Test** - منع التداخل
5. **Receipt Cancellation Test** - إلغاء سند القبض
6. **Due Cancellation Test** - إلغاء الاستحقاق
7. **Opening Balance Test** - الرصيد الافتتاحي
8. **Negative Balance Test** - الرصيد السالب (دائن للمستأجر)

### المرحلة 8: Docker & Deployment (أولوية متوسطة)

1. `Dockerfile` - بناء تطبيق Next.js
2. `docker-compose.yml` - Next.js + PostgreSQL + Nginx
3. `nginx.conf` - إعداد Nginx reverse proxy
4. `.env` - متغيرات البيئة
5. `docker-compose.prod.yml` - إعداد الإنتاج

### المرحلة 9: المراجعة النهائية (أولوية متوسطة)

- التحقق من التوافق مع `requirements.md`
- التحقق من القواعد المالية
- التحقق من RTL ودعم العربية
- التحقق من التصميم المتجاوب
- التحقق من الأمان
- التحقق من الأداء

---

## الجدول الزمني المقترح

| المرحلة | المدة المقدرة |
|---------|--------------|
| التوثيق | 1-2 يوم |
| البنية التحتية | 1 يوم |
| قاعدة البيانات | 1-2 يوم |
| Backend API | 3-4 أيام |
| Business Logic | 2-3 أيام |
| Frontend | 4-5 أيام |
| الاختبارات | 1-2 يوم |
| Docker & Deployment | 1 يوم |
| المراجعة | 1 يوم |

**الإجمالي المقدر**: 15-20 يوم عمل

---

## ملاحظات تنفيذية

1. **الرصيد الوحيد للحقيقة**: `requirements.md` هو المرجع الوحيد والنهائي
2. **لا افتراضات خارج الوثيقة**: لا تضف منطق أعمال غير مذكور
3. **المنطق المالي**: يجب أن يكون مطابقاً 100% للوثيقة
4. **لا توزيع للدفعات**: ممنوع ربط سند القبض باستحقاق محدد
5. **لا حالات دفع**: الاستحقاق لا يحتوي على حالة مدفوع/جزئي/متأخر
6. **الرصيد من الحركات المعتمدة فقط**
7. **الإلغاء لا يعني الحذف**: الحركات الملغاة تبقى للمراجعة
