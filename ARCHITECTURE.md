# معمارية النظام - نظام إدارة إيجارات العمارات

## نظرة عامة

نظام ويب متكامل لإدارة إيجارات العمارات يعتمد على بنية Next.js Full Stack مع قاعدة بيانات PostgreSQL.

## هيكل المشروع

```
rental-management/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # مجموعة صفحات المصادقة
│   │   └── login/                # تسجيل الدخول
│   ├── (dashboard)/              # مجموعة صفحات لوحة التحكم
│   │   ├── dashboard/            # لوحة التحكم الرئيسية
│   │   ├── buildings/            # العمارات
│   │   ├── floors/               # الطوابق
│   │   ├── units/                # الوحدات
│   │   ├── tenants/              # المستأجرين
│   │   ├── contracts/            # العقود
│   │   ├── dues/                 # الاستحقاقات
│   │   ├── receipts/             # سندات القبض
│   │   ├── reports/              # التقارير
│   │   ├── settings/             # الإعدادات
│   │   └── backups/              # النسخ الاحتياطية
│   ├── api/                      # API Routes
│   │   ├── auth/                 # المصادقة
│   │   ├── buildings/            # العمارات
│   │   ├── floors/               # الطوابق
│   │   ├── units/                # الوحدات
│   │   ├── tenants/              # المستأجرين
│   │   ├── contracts/            # العقود
│   │   ├── dues/                 # الاستحقاقات
│   │   ├── receipts/             # سندات القبض
│   │   ├── reports/              # التقارير
│   │   ├── dashboard/            # لوحة التحكم
│   │   ├── settings/             # الإعدادات
│   │   └── backups/              # النسخ الاحتياطية
│   ├── layout.tsx                # التخطيط الرئيسي RTL
│   └── globals.css               # الأنماط العامة
├── components/                   # مكونات React
│   ├── ui/                       # مكونات shadcn/ui
│   ├── forms/                    # نماذج الإدخال
│   ├── tables/                   # جداول البيانات
│   ├── charts/                   # الرسوم البيانية
│   ├── modals/                   # النوافذ المنبثقة
│   └── print/                    # قوالب الطباعة
├── lib/                          # المكتبات والمساعدات
│   ├── prisma.ts                 # عميل Prisma
│   ├── auth.ts                   # helpers المصادقة
│   ├── utils.ts                  # دوال مساعدة
│   ├── validation.ts             # التحقق من الصحة
│   └── formatters.ts             # تنسيق الأرقام والتواريخ
├── services/                     # منطق الأعمال
│   ├── balance.service.ts        # حساب الرصيد
│   ├── due-generation.service.ts # توليد الاستحقاقات
│   ├── cancellation.service.ts   # إلغاء الحركات
│   ├── contract-validation.ts    # التحقق من العقود
│   └── report.service.ts         # التقارير
├── types/                        # أنواع TypeScript
│   └── index.ts
├── prisma/
│   ├── schema.prisma             # مخطط قاعدة البيانات
│   └── migrations/               # الترقيات
├── tests/                        # الاختبارات
│   ├── unit/                     # اختبارات الوحدات
│   └── integration/              # اختبارات التكامل
├── docker/                       # إعداد Docker
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── .env
```

## طبقات النظام

### 1. طبقة العرض (Presentation Layer)
- Next.js App Router مع RTL
- React Server Components (RSC) للبيانات الأولية
- Client Components للتفاعلات
- Tailwind CSS + shadcn/ui للتصميم
- تنسيق أرقام وتواريخ عربية

### 2. طبقة API (API Layer)
- Next.js API Routes
- Middleware للمصادقة
- Validation بـ Zod
- Error handling موحد
- JSON response format

### 3. طبقة الخدمات (Service Layer)
- Business logic مفصول عن API
- حساب الرصيد من الحركات
- توليد الاستحقاقات التلقائية
- التحقق من قواعد الأعمال
- التقارير والإحصائيات

### 4. طبقة الوصول للبيانات (Data Access Layer)
- Prisma ORM
- Transactions للعمليات المالية
- Raw queries للتقارير المعقدة

### 5. طبقة قاعدة البيانات (Database Layer)
- PostgreSQL
- Foreign Keys
- Indexes
- Constraints
- Triggers للتدقيق (اختياري)

## تدفق البيانات

### إنشاء عقد إيجار
```
Frontend → API Route → Contract Validation → Prisma Transaction
                                    ↓
                              Due Generation Service
                                    ↓
                              Database (contracts + dues)
```

### إنشاء سند قبض
```
Frontend → API Route → Validation → Prisma Transaction
                                          ↓
                                    receipts table
```

### حساب رصيد المستأجر
```
API Request → Balance Service
                   ↓
              sum(approved dues) - sum(approved receipts)
                   ↓
              Response (balance, dues, receipts)
```

### كشف حساب المستأجر
```
API Request → Statement Service
                   ↓
              union(dues, receipts) ordered by date
                   ↓
              calculate running balance
                   ↓
              Response (statement lines)
```

## نموذج المصادقة

- iron-session للجلسات الآمنة
- bcrypt لتشفير كلمات المرور
- Middleware للتحقق من الجلسة
- Session-based authentication
- CSRF protection عبر SameSite cookies

## نموذج الجلسة

```typescript
interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  };
}
```

## معالجة الأخطاء

- Validation errors: 400 Bad Request
- Authentication errors: 401 Unauthorized
- Authorization errors: 403 Forbidden
- Not found: 404 Not Found
- Business rule violations: 409 Conflict
- Server errors: 500 Internal Server Error

## الأداء

- Database connection pooling via Prisma
- Server Components لتقليل JavaScript
- Optimistic updates للتفاعلات السريعة
- Pagination للقوائم الكبيرة
- Debounced search

## الأمان

- Password hashing with bcrypt
- Session-based auth with iron-session
- HTTPS in production
- SQL injection prevention via Prisma
- XSS prevention via React escaping
- Input validation with Zod
- Rate limiting on auth endpoints
