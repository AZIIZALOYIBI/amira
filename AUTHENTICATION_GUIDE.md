# دليل نظام تسجيل الدخول والألعاب عبر الإنترنت

## الميزات الجديدة

### 1. نظام تسجيل الدخول والتسجيل

#### التسجيل (إنشاء حساب جديد)
- اسم المستخدم: يجب أن يكون 3 أحرف على الأقل
- اسم العرض: الاسم الذي سيظهر في اللعبة
- كلمة المرور: يجب أن تكون 6 أحرف على الأقل
- تأكيد كلمة المرور: يجب أن تطابق كلمة المرور

#### تسجيل الدخول
- أدخل اسم المستخدم وكلمة المرور
- سيتم حفظ جلستك تلقائياً

### 2. أنواع اللعب

#### اللعب المحلي (على نفس الجهاز)
- اختر "لعب محلي"
- أدخل أسماء اللاعبين
- ابدأ اللعبة

#### اللعب عبر الإنترنت (بكود الدخول)
لعب الشطرنج مع لاعب آخر باستخدام كود من 6 أرقام

##### إنشاء غرفة جديدة:
1. اختر "لعب عبر الإنترنت"
2. اختر "إنشاء غرفة"
3. سيتم إنشاء كود دخول من 6 أرقام
4. شارك الكود مع الشخص الآخر
5. انتظر حتى ينضم اللاعب الآخر
6. ستبدأ اللعبة تلقائياً

##### الانضمام لغرفة موجودة:
1. اختر "لعب عبر الإنترنت"
2. اختر "الانضمام لغرفة"
3. أدخل كود الدخول المكون من 6 أرقام
4. اضغط "ابدأ اللعبة"
5. ستبدأ اللعبة فوراً

### 3. تخزين البيانات

يستخدم التطبيق `localStorage` لحفظ:
- معلومات المستخدمين المسجلين
- الجلسة الحالية
- الغرف النشطة
- الإحصائيات

### 4. ملاحظات أمنية

⚠️ **مهم**: هذا التطبيق يستخدم localStorage لحفظ كلمات المرور بشكل نصي. في بيئة الإنتاج الحقيقية، يجب:
- تشفير كلمات المرور
- استخدام خادم للمصادقة
- استخدام HTTPS
- تطبيق إجراءات أمنية إضافية

### 5. كيفية الاستخدام

1. افتح التطبيق
2. سجل حساباً جديداً أو سجل دخول
3. اختر نوع اللعبة (محلي أو عبر الإنترنت)
4. اختر وضع اللعب (كلاسيكي، سريع، خاطف، أو غير محدود)
5. ابدأ اللعبة

### 6. تنظيف الغرف القديمة

يتم حذف الغرف التي مضى عليها أكثر من 24 ساعة تلقائياً عند استدعاء `cleanupOldRooms()`

---

## New Features Guide (English)

### 1. Login and Registration System

#### Registration
- Username: minimum 3 characters
- Display Name: name shown in game
- Password: minimum 6 characters
- Confirm Password: must match

#### Login
- Enter username and password
- Session persists automatically

### 2. Game Types

#### Local Play (Same Device)
- Select "Local Play"
- Enter player names
- Start game

#### Online Play (Room Code)
Play chess with another player using a 6-digit code

##### Create Room:
1. Select "Online Play"
2. Choose "Create Room"
3. A 6-digit code will be generated
4. Share code with other player
5. Wait for other player to join
6. Game starts automatically

##### Join Room:
1. Select "Online Play"
2. Choose "Join Room"
3. Enter 6-digit room code
4. Click "Start Game"
5. Game starts immediately

### 3. Data Storage

Uses localStorage to save:
- Registered user information
- Current session
- Active rooms
- Statistics

### 4. Security Notes

⚠️ **Important**: This app uses localStorage with plaintext passwords. For production:
- Encrypt passwords
- Use server-side authentication
- Use HTTPS
- Implement additional security measures

### 5. How to Use

1. Open application
2. Register or login
3. Choose game type (local or online)
4. Select game mode (classic, rapid, blitz, unlimited)
5. Start game

### 6. Room Cleanup

Rooms older than 24 hours are automatically deleted when `cleanupOldRooms()` is called
