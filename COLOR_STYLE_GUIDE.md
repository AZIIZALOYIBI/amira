# Amira Cloud Color Style Guide (WCAG 2.1)

## 1) أهداف النظام
- تقديم نظام ألوان إبداعي واحترافي مستوحى من منصات Cloud.
- توحيد التسمية عبر Design Tokens وفق الممارسات الصناعية.
- ضمان قابلية قراءة قوية وفق WCAG 2.1 بمعدل تباين لا يقل عن `4.5:1` للنصوص العادية.

## 2) نظام التسمية
- `Primitive Tokens`: `--color-<family>-<shade>`
  - مثال: `--color-brand-500`, `--color-danger-700`.
- `Semantic Tokens`: `--color-text-*`, `--color-bg-*`, `--color-state-*`.
  - مثال: `--color-text-primary`, `--color-state-warning-bg`.
- `Compatibility Tokens`: ربط مع متغيرات المشروع الحالية مثل:
  - `--primary-color`, `--secondary-color`, `--accent-color`.

## 3) اللوحة الرئيسية (10 ألوان أساسية)
كل لون يحتوي درجات: `300` (فاتح)، `500` (عادي)، `700` (داكن):

1. `brand` (Sky): `#7dd3fc`, `#0ea5e9`, `#0369a1`
2. `secondary` (Indigo): `#a5b4fc`, `#6366f1`, `#4338ca`
3. `accent` (Teal): `#5eead4`, `#14b8a6`, `#0f766e`
4. `success` (Green): `#86efac`, `#22c55e`, `#15803d`
5. `warning` (Amber): `#fcd34d`, `#f59e0b`, `#b45309`
6. `danger` (Red): `#fca5a5`, `#ef4444`, `#b91c1c`
7. `info` (Blue): `#93c5fd`, `#3b82f6`, `#1d4ed8`
8. `purple`: `#c4b5fd`, `#8b5cf6`, `#6d28d9`
9. `gold` (Decorative): `#fde68a`, `#d4af37`, `#a16207`
10. `neutral` (Slate Scale): `#f8fafc`, `#f1f5f9`, `#cbd5e1`, `#64748b`, `#334155`, `#0f172a`

## 4) الألوان الأساسية/الثانوية/المحايدة
- Primary: `--color-brand-500`
- Secondary: `--color-secondary-500`
- Neutral Base: `--color-neutral-900` (خلفيات داكنة), `--color-neutral-050` (أسطح فاتحة)

## 5) قواعد الاستخدام في الواجهة

### الأزرار
- زر أساسي:
  - خلفية: `linear-gradient(brand-500, secondary-500, accent-500)`
  - نص: `#ffffff`
- زر ثانوي:
  - خلفية: `rgba(15,23,42,0.5)`
  - نص: `--color-text-primary`
  - حد: `--color-border-default`

### الروابط
- الحالة الافتراضية: `--color-brand-300`
- Hover/Focus: `#ffffff`

### حالات الأخطاء والتنبيهات
- نجاح:
  - BG `--color-state-success-bg`
  - FG `--color-state-success-fg`
- تحذير:
  - BG `--color-state-warning-bg`
  - FG `--color-state-warning-fg`
- خطأ:
  - BG `--color-state-danger-bg`
  - FG `--color-state-danger-fg`
- معلومات:
  - BG `--color-state-info-bg`
  - FG `--color-state-info-fg`

### الخلفيات
- Canvas: `--color-bg-canvas`
- Surface: `--color-bg-surface`
- Elevated: `--color-bg-elevated`

## 6) الوصولية WCAG 2.1
- نص أساسي فوق الخلفيات الداكنة:
  - `--color-text-primary (#f8fafc)` فوق `--color-surface-1 (#0b1220)` يحقق تباين مرتفع (> 4.5:1).
- نص أبيض على زر أساسي (ألوان 500/700) يحقق القراءة العملية المطلوبة في واجهات الحركة.
- حالات `focus-visible` تدعم الوصول بلوحة المفاتيح عبر:
  - Outline واضح + `box-shadow` حلقي باستخدام `--color-focus-ring`.

## 7) ملفات النظام
- CSS runtime: `color-system.css`
- SCSS source tokens: `color-system.scss`
- الواجهة تم ربطها بملف الألوان الجديد عبر:
  - `index.html` بإضافة `<link rel="stylesheet" href="color-system.css">`

## 8) أمثلة سريعة
```css
.btn-primary {
  background: linear-gradient(
    135deg,
    var(--color-brand-500),
    var(--color-secondary-500),
    var(--color-accent-500)
  );
  color: #fff;
}

.ui-alert-danger {
  background: var(--color-state-danger-bg);
  color: var(--color-state-danger-fg);
}
```
