import { useAuth } from '../contexts/AuthContext';

export default function PendingBanner() {
  const { isPending } = useAuth();
  if (!isPending) return null;

  return (
    <div
      style={{
        background: '#FAEEDA',
        border: '0.5px solid #EF9F27',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: 14,
        color: '#633806',
        direction: 'rtl',
      }}
    >
      החשבון שלך ממתין לאישור מנהל. ניתן לצפות בתכנים אך לא ליצור תוכן חדש.
    </div>
  );
}
