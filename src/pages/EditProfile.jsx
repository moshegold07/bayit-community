import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { s, Header, FieldRow } from "../components/shared";

export default function EditProfile({ user, onBack, onSaved }) {
  const [form, setForm] = useState({
    first: user.first || "",
    last: user.last || "",
    city: user.city || "",
    domain: user.domain || "",
    li: user.li || "", website: user.website || "",
    does: user.does || "",
    needs: user.needs || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.first.trim() || !form.last.trim()) { setErr("שם פרטי ושם משפחה הם שדות חובה"); return; }
    setLoading(true);
    setErr("");
    try {
      await updateDoc(doc(db, "users", user.uid), {
        first: form.first.trim(),
        last: form.last.trim(),
        city: form.city.trim(),
        domain: form.domain.trim(),
        li: form.li.trim(),
        website: form.website.trim() && !form.website.trim().startsWith("http") ? "https://" + form.website.trim() : form.website.trim(),
        does: form.does.trim(),
        needs: form.needs.trim(),
      });
      setSuccess(true);
      onSaved({ ...user, ...form });
    } catch (e) {
      setErr("שגיאה בשמירה: " + e.message);
    }
    setLoading(false);
  }

  async function requestDelete() {
    if (!window.confirm("האם אתה בטוח שברצונך לבקש מחיקת הפרופיל שלך?")) return;
    try {
      await updateDoc(doc(db, "users", user.uid), { deleteRequest: true });
      alert("הבקשה נשלחה לאדמין. הפרופיל שלך יימחק בהקדם.");
    } catch (e) {
      setErr("שגיאה בשליחת הבקשה");
    }
  }

  return (
    <div style={s.wrap}>
      <Header>
        <button style={s.btnOutline} onClick={onBack}>חזרה לדשבורד</button>
      </Header>
      <div style={s.body}>
        <div style={s.card}>
          {err && <div style={{ background: "#FCEBEB", color: "#791F1F", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>{err}</div>}
          {success && <div style={{ background: "#EAF3DE", color: "#27500A", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>הפרופיל עודכן בהצלחה!</div>}

          <div style={s.sectionTitle}>פרטים אישיים</div>
          <div style={s.twoCol}>
            <FieldRow label="שם פרטי *">
              <input style={s.input} dir="auto" value={form.first} onChange={e => set("first", e.target.value)} />
            </FieldRow>
            <FieldRow label="שם משפחה *">
              <input style={s.input} dir="auto" value={form.last} onChange={e => set("last", e.target.value)} />
            </FieldRow>
          </div>
          <div style={s.twoCol}>
            <FieldRow label="עיר מגורים">
              <input style={s.input} dir="auto" value={form.city} onChange={e => set("city", e.target.value)} />
            </FieldRow>
            <FieldRow label="תחום עיסוק">
              <input style={s.input} dir="auto" value={form.domain} onChange={e => set("domain", e.target.value)} />
            </FieldRow>
          </div>
          <FieldRow label="לינקדין">
            <input style={s.input} placeholder="https://linkedin.com/in/..." dir="ltr" value={form.li} onChange={e => set("li", e.target.value)} />
          </FieldRow>
          <FieldRow label="אתר אינטרנט">
            <input style={s.input} placeholder="https://yourwebsite.com" dir="ltr" value={form.website} onChange={e => set("website", e.target.value)} />
          </FieldRow>

          <div style={s.sectionTitle}>פרופיל מקצועי</div>
          <FieldRow label="מה אני עושה">
            <textarea style={s.textarea} dir="auto" value={form.does} onChange={e => set("does", e.target.value)} />
          </FieldRow>
          <FieldRow label="מה אני מחפש / צריך">
            <textarea style={s.textarea} dir="auto" value={form.needs} onChange={e => set("needs", e.target.value)} />
          </FieldRow>

          <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
            טלפון ואימייל אינם ניתנים לשינוי — הם המזהה הייחודי שלך
          </div>
          <div style={s.twoCol}>
            <div style={{ padding: "8px 10px", background: "#f5f5f3", borderRadius: 8, fontSize: 13, color: "#888", direction: "ltr" }}>{user.phone}</div>
            <div style={{ padding: "8px 10px", background: "#f5f5f3", borderRadius: 8, fontSize: 13, color: "#888" }}>{user.email}</div>
          </div>

          <button style={{ ...s.btnPrimary, marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={save} disabled={loading}>
            {loading ? "שומר..." : "שמור שינויים"}
          </button>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "0.5px solid #eee" }}>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>מחיקת פרופיל</div>
            <button onClick={requestDelete} style={{ padding: "8px 16px", background: "transparent", color: "#A32D2D", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              בקש מחיקת פרופיל
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
