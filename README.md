# نظام إدارة إيجارات العمارات

نظام ويب متكامل لإدارة العمارات والطوابق والوحدات العقارية والمستأجرين وعقود الإيجار والاستحقاقات والدفعات.

## التقنية

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (Full Stack)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: iron-session + bcrypt
- **Containerization**: Docker + Docker Compose

## الميزات الرئيسية

- إدارة العمارات والطوابق والوحدات
- إدارة المستأجرين وعقود الإيجار
- توليد استحقاقات الإيجار تلقائياً
- سندات القبض بدون توزيع على الاستحقاقات
- كشف حساب المستأجر مع رصيد متحرك
- تقارير متعددة
- طباعة وتصدير PDF/Excel
- واجهة عربية RTL
- تصميم متجاوب

## المعادلة المالية

```
رصيد المستأجر = إجمالي الاستحقاقات المعتمدة - إجمالي سندات القبض المعتمدة
```

## التشغيل

### 1. المتطلبات
- Node.js 20+
- PostgreSQL 16+
- Docker (اختياري)

### 2. إعداد قاعدة البيانات

```bash
# تأكد من تشغيل PostgreSQL ثم نفذ:
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. التشغيل المحلي

```bash
npm install
npm run dev
```

### 4. التشغيل باستخدام Docker

```bash
docker compose up -d
```

النظام يعمل على `http://localhost:3000`.

بيانات الدخول الافتراضية:
- **البريد**: admin@rental.com
- **كلمة المرور**: admin123

## التوثيق

- `IMPLEMENTATION_PLAN.md` - خطة التنفيذ
- `ARCHITECTURE.md` - معمارية النظام
- `DATABASE.md` - تصميم قاعدة البيانات
- `BUSINESS_RULES.md` - قواعد الأعمال

## المرجع

جميع المتطلبات موجودة في `requirements.md` - المصدر الوحيد للحقيقة.
