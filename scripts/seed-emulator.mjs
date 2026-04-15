/**
 * Seed script for Firebase Emulator
 * Populates Firestore with sample entrepreneurs and settings
 *
 * Usage: node scripts/seed-emulator.mjs
 * Requires: Firebase Auth + Firestore emulators running on default ports
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
} from 'firebase/firestore';

const app = initializeApp({ projectId: 'bait-de724', apiKey: 'fake-api-key' });
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const USERS = [
  {
    email: 'admin@bayit.dev',
    password: 'admin123',
    profile: {
      first: 'משה',
      last: 'מנהל',
      phone: '050-0000001',
      email: 'admin@bayit.dev',
      city: 'תל אביב',
      domain: 'ניהול קהילות',
      categories: ['ניהול קהילות', 'פיתוח עסקי'],
      does: 'מנהל את קהילת בית — פלטפורמה ליזמים. מחבר בין אנשים ורעיונות.',
      needs: 'מפתחים מתנדבים, מעצבי UX, ויזמים שרוצים להצטרף לקהילה.',
      role: 'admin',
      status: 'active',
      createdAt: '2025-01-15T10:00:00.000Z',
    },
  },
  {
    email: 'dana@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'דנה',
      last: 'כהן',
      phone: '050-0000002',
      email: 'dana@bayit.dev',
      city: 'הרצליה',
      domain: 'AI, מוצר',
      categories: ['AI', 'ניהול מוצר'],
      does: 'מובילה מוצר AI בסטארטאפ בתחום ה-HealthTech. ניסיון של 8 שנים בהובלת מוצר.',
      needs: 'שותף טכני (CTO), משקיעים בשלב Seed, ומנטורים מתחום הבריאות.',
      li: 'https://linkedin.com/in/dana-cohen',
      website: 'https://dana-builds.dev',
      role: 'user',
      status: 'active',
      createdAt: '2025-02-10T14:30:00.000Z',
    },
  },
  {
    email: 'yossi@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'יוסי',
      last: 'לוי',
      phone: '050-0000003',
      email: 'yossi@bayit.dev',
      city: 'באר שבע',
      domain: 'פיתוח Full Stack',
      categories: ['פיתוח Full Stack', 'DevOps'],
      does: 'מפתח Full Stack עצמאי. בונה אפליקציות ווב עם React ו-Node.js. מתמחה ב-Firebase.',
      needs: 'פרויקטים מעניינים, שותפויות עם מעצבים, ולקוחות בתחום ה-SaaS.',
      li: 'https://linkedin.com/in/yossi-levi',
      role: 'user',
      status: 'active',
      createdAt: '2025-03-05T09:15:00.000Z',
    },
  },
  {
    email: 'noa@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'נועה',
      last: 'ברק',
      phone: '050-0000004',
      email: 'noa@bayit.dev',
      city: 'חיפה',
      domain: 'UX/UI, עיצוב',
      categories: ['UX/UI', 'עיצוב גרפי'],
      does: 'מעצבת UX/UI עם התמחות באפליקציות מובייל. עובדת עם סטארטאפים בשלבים מוקדמים.',
      needs: 'שיתופי פעולה עם מפתחים, פרויקטים בתחום החינוך והבריאות.',
      website: 'https://noa-designs.co.il',
      role: 'user',
      status: 'active',
      createdAt: '2025-03-20T16:45:00.000Z',
    },
  },
  {
    email: 'avi@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'אבי',
      last: 'שמש',
      phone: '050-0000005',
      email: 'avi@bayit.dev',
      city: 'ירושלים',
      domain: 'פינטק, בלוקצ\'יין',
      categories: ['פינטק', 'בלוקצ\'יין'],
      does: 'יזם סדרתי בתחום הפינטק. הקמתי שני סטארטאפים, אחד נרכש.',
      needs: 'מפתחי Solidity, שיווקיסט דיגיטלי, וחיבורים למשקיעים בינלאומיים.',
      li: 'https://linkedin.com/in/avi-shemesh',
      role: 'user',
      status: 'active',
      createdAt: '2025-04-01T11:00:00.000Z',
    },
  },
  {
    email: 'rotem@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'רותם',
      last: 'גולן',
      phone: '050-0000006',
      email: 'rotem@bayit.dev',
      city: 'תל אביב',
      domain: 'EdTech, חינוך',
      categories: ['EdTech', 'חינוך'],
      does: 'מייסדת סטארטאפ בתחום החינוך הטכנולוגי. בונה פלטפורמת למידה אדפטיבית לילדים עם לקויות למידה.',
      needs: 'מפתח React Native, יועץ פדגוגי, ומשקיעי אימפקט.',
      li: 'https://linkedin.com/in/rotem-golan',
      website: 'https://learnbright.io',
      role: 'user',
      status: 'active',
      createdAt: '2025-04-05T13:20:00.000Z',
    },
  },
  {
    email: 'omer@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'עומר',
      last: 'דרור',
      phone: '050-0000007',
      email: 'omer@bayit.dev',
      city: 'רעננה',
      domain: 'סייבר, אבטחת מידע',
      categories: ['סייבר', 'אבטחת מידע'],
      does: 'יועץ סייבר עצמאי. 12 שנות ניסיון ב-8200 ובתעשייה. מבצע מבדקי חדירה ובונה ארכיטקטורות אבטחה.',
      needs: 'שותף עסקי לפיתוח מוצר SaaS בתחום ה-SIEM, ומפתח Backend בכיר.',
      li: 'https://linkedin.com/in/omer-dror',
      role: 'user',
      status: 'active',
      createdAt: '2025-04-12T08:00:00.000Z',
    },
  },
  {
    email: 'shira@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'שירה',
      last: 'מזרחי',
      phone: '050-0000008',
      email: 'shira@bayit.dev',
      city: 'פתח תקווה',
      domain: 'FoodTech',
      categories: ['FoodTech', 'קיימות'],
      does: 'מייסדת שותפה בסטארטאפ FoodTech שמפתח חלבון אלטרנטיבי מבוסס תסיסה. רקע בביוטכנולוגיה.',
      needs: 'חיבור למעבדות מזון, רגולציה FDA/EU, ומשקיעי CleanTech.',
      website: 'https://greenprotein.co.il',
      role: 'user',
      status: 'active',
      createdAt: '2025-04-15T10:30:00.000Z',
    },
  },
  {
    email: 'eitan@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'איתן',
      last: 'רוזנברג',
      phone: '050-0000009',
      email: 'eitan@bayit.dev',
      city: 'מודיעין',
      domain: 'PropTech, נדל"ן',
      categories: ['PropTech', 'נדל"ן'],
      does: 'בונה פלטפורמה לניהול נכסים חכם עם IoT ו-AI. רקע של 15 שנה בנדל"ן מסחרי.',
      needs: 'מפתח IoT/Embedded, מעצב UX עם ניסיון בדשבורדים, ושותפויות עם חברות ניהול נכסים.',
      li: 'https://linkedin.com/in/eitan-rosenberg',
      role: 'user',
      status: 'active',
      createdAt: '2025-05-01T07:45:00.000Z',
    },
  },
  {
    email: 'maya@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'מאיה',
      last: 'אשכנזי',
      phone: '050-0000010',
      email: 'maya@bayit.dev',
      city: 'הרצליה',
      domain: 'HR Tech',
      categories: ['HR Tech', 'AI'],
      does: 'CTO בסטארטאפ HR Tech. בונה כלי AI לסינון ושיבוץ עובדים. קודם הובלתי צוותי פיתוח ב-Wix.',
      needs: 'Data Scientists עם ניסיון ב-NLP, ואנשי מכירות B2B לשוק האמריקאי.',
      li: 'https://linkedin.com/in/maya-ashkenazi',
      website: 'https://talentai.dev',
      role: 'user',
      status: 'active',
      createdAt: '2025-05-10T14:00:00.000Z',
    },
  },
  {
    email: 'tal@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'טל',
      last: 'נחמיאס',
      phone: '050-0000011',
      email: 'tal@bayit.dev',
      city: 'נתניה',
      domain: 'ייעוץ עסקי, מנטורינג',
      categories: ['ייעוץ עסקי', 'מנטורינג'],
      does: 'מנטור ליזמים בשלבים מוקדמים. עזרתי ל-20+ סטארטאפים לגייס סבב ראשון. שותף לשעבר ב-Techstars.',
      needs: 'יזמים מוכשרים לליווי, הזדמנויות Angel Investment, ושיתופי פעולה עם אקסלרטורים.',
      li: 'https://linkedin.com/in/tal-nachmias',
      role: 'user',
      status: 'active',
      createdAt: '2025-05-20T09:30:00.000Z',
    },
  },
  {
    email: 'pending1@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'תמר',
      last: 'אלון',
      phone: '050-0000012',
      email: 'pending1@bayit.dev',
      city: 'רמת גן',
      domain: 'שיווק דיגיטלי',
      categories: ['שיווק דיגיטלי'],
      does: 'מנהלת שיווק דיגיטלי עם 5 שנות ניסיון. מתמחה ב-SEO ו-Content Marketing.',
      needs: 'הזדמנויות ייעוץ, שותפויות עם סטארטאפים.',
      role: 'user',
      status: 'pending',
      createdAt: '2025-06-01T08:30:00.000Z',
    },
  },
  {
    email: 'pending2@bayit.dev',
    password: 'test1234',
    profile: {
      first: 'ליאור',
      last: 'פרידמן',
      phone: '050-0000013',
      email: 'pending2@bayit.dev',
      city: 'אשדוד',
      domain: 'לוגיסטיקה, Supply Chain',
      categories: ['לוגיסטיקה', 'Supply Chain'],
      does: 'בונה פלטפורמה לאופטימיזציה של שרשרת אספקה לעסקים קטנים ובינוניים.',
      needs: 'מפתח Backend, אנשי מכירות, ולקוחות פיילוט בתחום הקמעונאות.',
      role: 'user',
      status: 'pending',
      createdAt: '2025-06-05T11:15:00.000Z',
    },
  },
];

const HOUSE_RULES = `ברוכים הבאים לקהילת "בית" — קהילה של יזמים, עבור יזמים.

כללי הקהילה:
1. כבוד הדדי — אנחנו כאן כדי לעזור אחד לשני
2. שיתוף ידע — שתפו ניסיון, טיפים ותובנות
3. אין ספאם — לא פרסומות, לא מכירות אגרסיביות
4. פרטיות — אל תשתפו מידע של אחרים בלי אישור
5. תרמו — הקהילה חזקה כמו החברים שלה

בהצלחה! 🏠`;

async function seed() {
  console.log('Seeding Firebase Emulator...\n');

  for (const user of USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const uid = cred.user.uid;

      await setDoc(doc(db, 'users', uid), user.profile);
      await setDoc(doc(db, 'phoneIndex', user.profile.phone), { uid });

      const role = user.profile.role === 'admin' ? ' (ADMIN)' : '';
      const status = user.profile.status === 'pending' ? ' [PENDING]' : '';
      console.log(`  + ${user.profile.first} ${user.profile.last}${role}${status} — ${user.email}`);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        console.log(`  ~ ${user.profile.first} ${user.profile.last} — already exists, skipping`);
      } else {
        console.error(`  ! Error creating ${user.email}:`, e.message);
      }
    }
  }

  // Seed house rules
  await setDoc(doc(db, 'settings', 'houseRules'), {
    text: HOUSE_RULES,
    updatedAt: new Date().toISOString(),
  });
  console.log('\n  + House rules added');

  console.log('\n--- Seed complete! ---');
  console.log(`\n  ${USERS.length} users created (1 admin, ${USERS.filter(u => u.profile.status === 'active' && u.profile.role !== 'admin').length} active, ${USERS.filter(u => u.profile.status === 'pending').length} pending)`);
  console.log('\nTest accounts:');
  console.log('  Admin:   admin@bayit.dev / admin123');
  console.log('  User:    dana@bayit.dev / test1234  (or any active user)');
  console.log('  Pending: pending1@bayit.dev / test1234');
  console.log('\nEmulator UI: http://localhost:4000');
  console.log('App:         http://localhost:5173');

  process.exit(0);
}

seed();
