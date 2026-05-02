# Bayit Community — ROADMAP מבוסס שיחה עם אדמין (29.4.2026)

**מקור:** שיחת WhatsApp עם בית-אדמין, 29.4.2026
**תאריך מסמך:** 2026-05-02
**סטטוס:** טיוטה לתעדוף — ממתין לאישור Admin על סדר השלבים

---

## 🎯 Bottom Line

7 פיצ'רים גדולים, מחולקים ל-5 שלבים. **שלב 1 ושלב 2 הם הליבה** של מה שהאדמין רוצה לראות (דף בית חדש + מניפסט + תור הפצה). שלב 5 (i18n + תרגום אוטומטי) הוא הכי יקר וטכנית מסוכן — מומלץ לדחות אחרי שיש משתמשים בפועל מחו"ל.

**סיכון מרכזי לשים לב אליו:** Cross-posting אוטומטי ל-IG/FB/X/LinkedIn ב"יומן מסע" — דורש OAuth ל-4 פלטפורמות, חלקן לא מאפשרות פוסטים אוטומטיים מחשבונות אישיים (במיוחד Instagram). ייתכן שצריך להגדיר ציפיות מחדש כאן.

---

## 📋 פירוק למשימות

### Phase 0 — ניקוי תשתית
**מטרה:** להסיר טאבים שלא נחוצים, לפנות מקום למבנה חדש

| משימה | פירוט | מורכבות |
|---|---|---|
| 0.1 הסרת טאבים מהניווט | להוריד מ-Navbar: Projects, Events, Polls, Resources, Forums | S |
| 0.2 הסרת ראוטים מ-App.jsx | למחוק: `/events`, `/projects`, `/resources`, `/forums`, `/polls` (כולל nested) | S |
| 0.3 ארכוב דפים בקוד | להעביר ל-`src/pages/_archived/` במקום למחוק (לאופציה לחזור) | S |
| 0.4 ניקוי Firestore rules | להסיר rules למשאבים, פרויקטים, אירועים | S |
| 0.5 אישור עם אדמין | לאשר שההסרה לפי הכוונה — האם להשאיר Forums/Messages/Matching? | — |

**החלטות שאושרו (2026-05-02):**
- ✅ **טאבים למחיקה:** פרויקטים, תוכן (Resources), סקרים (Polls), אירועים (Events)
- ✅ **Forums + Messages + Matching + DevTickets** — לא במחיקה (לא הוזכרו → נשארים בינתיים)
- ✅ **VentureDetail / VentureForm** — נשארים (חלק מ"השבוע להפצה")

---

### Phase 1 — דף בית חדש + מניפסט inline
**מטרה:** התוצר הוויזואלי הראשי שהאדמין מבקש

| משימה | פירוט | מורכבות |
|---|---|---|
| 1.1 העברת המניפסט מ-Modal ל-inline | `ManifestoModal` הופך ל-`ManifestoBanner` שיושב בראש Dashboard | M |
| 1.2 כפתור X לסגירה | סוגר את המניפסט עם persistance ב-localStorage (לפי גרסה) | S |
| 1.3 4 כפתורי שיתוף | X (Twitter), Facebook, Instagram*, WhatsApp | M |
| 1.4 OG-image דינמית למניפסט | חצי מהמניפסט כתמונה + לוגו — Vercel OG (`@vercel/og`) | M |
| 1.5 דף בית מאחורי המניפסט | כשמניפסט סגור — מתגלה `Dashboard` חדש | S |
| 1.6 שתי לשוניות (Tabs) ב-Dashboard | "השבוע להפצה" + "מחכים בתור" — נטען מ-`ventures` collection לפי `status` | M |
| 1.7 קישור אישי לשיתוף | UTM-style URL בכפתורי שיתוף: `bayit-community.vercel.app/?ref={uid}` | S |

**הבהרה שניתנה ע"י האדמין:**
- "מניפסט לא בפופאפ" → הוא **חלק מהדף**, מעליו, סגירה חושפת את התוכן

***Instagram*: אין API לפוסטים אוטומטיים מחשבונות פרטיים. הכפתור יפתח את ה-app/site עם פרטים מוכנים, אבל המשתמש צריך לאשר ידנית.**

**שאלות פתוחות (P1):**
- [ ] **טקסט המניפסט** — נמצא ב-`settings/manifesto`. מי מעלה את הגרסה הסופית?
- [ ] **OG image** — האם יש עיצוב מוכן או צריך להפיק?
- [ ] **המבנה של "השבוע להפצה"** — כמה ventures בשבוע? מי מקדם מ"בתור" ל"השבוע"? (אדמין ידני)

---

### Phase 2 — מערכת ניקוד אישי + מעקב המרות
**מטרה:** Gamification + טריגר להתנהגות (שיתופים)

| משימה | פירוט | מורכבות |
|---|---|---|
| 2.1 הוספת שדה `score` ל-`users` | נשמר על ה-user doc | S |
| 2.2 שדה `referralCode` ל-`users` | קוד ייחודי קצר (slug של 6 תווים) — נוצר אוטומטית בהרשמה | S |
| 2.3 הוספת שדה `referredBy` למשתמש חדש | מקליטים `?ref=XXX` בעת register | S |
| 2.4 קוביית ניקוד בכרטיס אישי | בפינת ה-Dashboard / EditProfile — מציגה את הניקוד הנוכחי | S |
| 2.5 לחיצה על קוביה — היסטוריית שיתופים | מציגה רשימה של מה שהמשתמש שיתף (collection חדש: `userActivity`) | M |
| 2.6 Gating על שיתוף venture | אם `score < 10` — לא מאפשר ליצור venture חדש | S |
| 2.7 רישום אירוע שיתוף | כל לחיצה על כפתור שיתוף → POST ל-`/api/track-share` (Vercel function) | M |
| 2.8 מעקב המרות | כשמתבצע `register` עם `?ref=XXX` → מעלים את הניקוד של בעל הקוד | M |
| 2.9 מערכת חוקי ניקוד | מסמך תצורה: 1 שיתוף = X, חבר שנרשם = X, וכו' | S |

**חוקי ניקוד שדווחו:**
- 5 חברים שמצטרפים = **1 נקודה**
- 50 חברים שמצטרפים = **כניסה לתור הפצה** (כלומר venture שלך עולה לתור)
- 10 נקודות = **פתיחת יכולת שיתוף venture**

**שאלות פתוחות (P1):**
- [ ] **כפילות בין "ניקוד" ל"כניסה לתור"** — ב-50 חברים נכנסים אוטומטית לתור? או רק נפתחת אפשרות בקשה?
- [ ] **שיתוף שלא הוביל להרשמה** — מקבל ניקוד? כמה?
- [ ] **תקינות הקוד** — מה קורה אם משתמש נמחק? הניקוד שניתן לבעל הקוד נשאר?
- [ ] **תצוגת leaderboard?** — לא הוזכר אבל נפוץ במערכות כאלה

---

### Phase 3 — יומן מסע (Journey Log)
**מטרה:** פיצ'ר תוכן יומיומי ליזם + cross-posting

| משימה | פירוט | מורכבות |
|---|---|---|
| 3.1 Collection `journeyPosts` | `{userId, text(200), imageUrl?, createdAt, sharedTo[]}` | S |
| 3.2 דף `/journey` או טאב חדש | feed כרונולוגי | M |
| 3.3 טופס יצירת פוסט | 200 תווים + העלאת תמונה | M |
| 3.4 העלאת תמונות | **דרוש Firebase Storage** (לא הופעל עדיין) או Cloudinary | L |
| 3.5 Reminder יומי ליזם | התראה ב-app + אופציה לפוש | M |
| 3.6 Cross-posting — X | OAuth 2.0 + Twitter API v2 | L |
| 3.7 Cross-posting — LinkedIn | OAuth 2.0 + LinkedIn API | L |
| 3.8 Cross-posting — Facebook | Graph API, רק לדפים (לא לפרופיל אישי) | L |
| 3.9 Cross-posting — Instagram | **לא קיים API אישי** — רק Business account דרך FB Graph | XL/חסום |
| 3.10 הגדרות per-post | המשתמש בוחר באילו פלטפורמות לשתף | S |

**🚨 סיכון טכני מרכזי:**
- **Instagram** — אין API לפוסטים מחשבונות אישיים. רק חשבונות עסקיים מקושרים לדף FB.
- **Facebook אישי** — Graph API לא מאפשר פרסום לפרופיל אישי (רק דפים) מאז 2018.
- **X/LinkedIn** — אפשריים אבל דורשים OAuth + ניהול tokens לכל משתמש.

**הצעה לאדמין:** להתחיל **רק עם X + LinkedIn** ב-MVP. ל-IG/FB — להוציא תוכן מוכן (טקסט + תמונה) שהמשתמש יעלה ידנית בלחיצה אחת ("Copy & Open IG").

**שאלות פתוחות (P1):**
- [ ] **תקציב שירות תמונות** — Firebase Storage חינמי עד 5GB, אחר כך משלמים
- [ ] **Reminder daily** — ב-app בלבד (notifications API)? או SMS/WhatsApp?
- [ ] **תזמון פוסטים?** — האם יזם רוצה לכתוב 7 פוסטים ולפזר על שבוע? (לא הוזכר — נראה מיותר ל-MVP)

---

### Phase 4 — שיתוף + Tracking מתקדם
**מטרה:** סגירת לולאת המעקב על קישורים אישיים

| משימה | פירוט | מורכבות |
|---|---|---|
| 4.1 Vercel function `/api/r/{code}` | מנתבת ומעדכנת מונה לפני redirect | M |
| 4.2 Dashboard לאדמין | טבלה: כמה הצטרפו דרך כל קוד | M |
| 4.3 Dashboard למשתמש | "כמה אנשים הצטרפו דרך הקישור שלך" | S |
| 4.4 OG image דינמית per ref | תמונה שונה לכל venture/user שמשתפים | L |

---

### Phase 5 — i18n + תרגום אוטומטי
**מטרה:** תמיכה בקהילה גלובלית

| משימה | פירוט | מורכבות |
|---|---|---|
| 5.1 בחירת ספריית i18n | `react-i18next` (מומלץ) | S |
| 5.2 הוצאת מחרוזות UI לקבצי JSON | כל הטקסטים הקבועים → 6 קבצי שפה | L |
| 5.3 בחירת שפות | ✅ **MVP: עברית + אנגלית בלבד**. הרחבה ל-4 שפות נוספות בעתיד לפי דרישה | — |
| 5.4 בחירת תרגום אוטומטי לתוכן | DeepL / Google Translate / OpenAI | M |
| 5.5 שמירת תרגומים ב-cache | מאחר ש-API עולה כסף — לשמור ב-Firestore | M |
| 5.6 detection שפת המשתמש | מ-browser locale + העדפה במשתמש | S |
| 5.7 Toggle שפה ב-Navbar | תפריט שפה גלוי | S |

**עלות מוערכת (MVP he+en):** DeepL Free = 500K תווים/חודש בחינם. ב-200 ventures × 1 שפה (תרגום one-way) = ~100K תווים → **בחינם**. הרחבה ל-6 שפות תדרוש תוכנית בתשלום.

**החלטות שאושרו (2026-05-02):**
- ✅ **MVP: עברית + אנגלית בלבד**
- ✅ הרחבה לשפות נוספות בהמשך — לפי ביקוש בפועל

**שאלות פתוחות (P1):**
- [ ] **תרגום של conversational content (Forum/Messages)** — לא הוזכר. נראה מיותר ל-MVP.

---

## 🗓️ סדר ביצוע מומלץ

```
Week 1-2:  Phase 0 (cleanup) + תחילת Phase 1
Week 3-4:  Phase 1 (Home + Manifesto + tabs) → DELIVERABLE לאדמין לבדיקה
Week 5-6:  Phase 2 (Score + Referrals)
Week 7-8:  Phase 4 (Tracking) — לוקח עוד שבוע אחרי שצברנו data
Week 9-12: Phase 3 (Journey Log) — הכי מורכב טכנית
Week 13+:  Phase 5 (i18n) — אחרי שיש משתמשים בפועל מחו"ל
```

---

## ❓ שאלות פתוחות לאדמין (לפני התחלה)

### ✅ נסגר (2026-05-02)
1. ~~טאבים למחיקה~~ → Projects, Events, Polls, Resources. השאר נשארים.
2. ~~טקסט המניפסט~~ → אדמין יכין ויעביר.
3. ~~שפות~~ → MVP: עברית + אנגלית בלבד.

### P1 — לפני שלב רלוונטי
4. **חוקי ניקוד מדויקים** — מה נותן נקודות חוץ מהרשמת חברים?
5. **Cross-posting Instagram/Facebook** — מסכימים שיהיה ידני (Copy & Open) במקום אוטומטי?
6. **תקציב חודשי** — Firebase Storage + Twitter API

### P2 — נחמד שיתבהר בהמשך
7. **Leaderboard ציבורי** של ניקוד?
8. **קוד הפניה אישי** — slug חופשי או random?
9. **תזמון פוסטים** ביומן מסע?

---

## 📦 קבצים שצפויים להשתנות

```
src/
  App.jsx                          # הסרת ראוטים
  components/
    Navbar.jsx                     # הסרת לינקים
    ManifestoModal.jsx             → ManifestoBanner.jsx
    ScoreCube.jsx                  # חדש
    ShareButtons.jsx               # חדש
    JourneyPostCard.jsx            # חדש
  pages/
    Dashboard.jsx                  # rewrite — מניפסט inline + tabs
    Journey.jsx                    # חדש
    _archived/Events.jsx           # ארכוב
    _archived/Projects.jsx         # ארכוב
    _archived/Polls.jsx            # ארכוב
    _archived/Resources.jsx        # ארכוב
  contexts/
    LanguageContext.jsx            # חדש (Phase 5)
  utils/
    i18n.js                        # חדש (Phase 5)
    referralTracking.js            # חדש (Phase 2)

api/
  claim-queue-number.js            # קיים
  track-share.js                   # חדש
  track-referral.js                # חדש
  social-share/
    twitter.js                     # חדש (Phase 3)
    linkedin.js                    # חדש (Phase 3)

firestore.rules                    # עדכון — הסרת events/projects/resources, הוספת journeyPosts
```

---

## 🎯 הצעת MVP מינימלי לאישור מהיר עם אדמין

אם רוצים תוצאה ויזואלית **תוך שבועיים**:
- ✅ Phase 0 (cleanup)
- ✅ Phase 1 (home + manifesto + tabs + share buttons)
- ⏸️ הכל אחר → בהמשך

זה מספיק כדי שהאדמין יראה את הכיוון, ייתן feedback, ונוכל לתכנן עומק.
