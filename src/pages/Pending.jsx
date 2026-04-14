import { s, Header } from "../components/shared";

export default function Pending({ onLogout }) {
  return (
    <div style={s.wrap}>
      <Header>
        <button style={s.btnOutline} onClick={onLogout}>התנתקות</button>
      </Header>
      <div style={s.body}>
        <div style={{ background: "#FAEEDA", border: "0.5px solid #EF9F27", borderRadius: 12, padding: "1.5rem", textAlign: "center", marginTop: "1rem" }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: "#633806", marginBottom: 8 }}>הבקשה שלך התקבלה!</div>
          <div style={{ fontSize: 14, color: "#854F0B" }}>הפרופיל שלך ממתין לאישור מנהל. תוכל להתחבר לאחר האישור.</div>
        </div>
      </div>
    </div>
  );
}
