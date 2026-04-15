import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { s, BLUE, BLUE_DK } from '../components/shared';
import { FieldRow } from '../components/shared';
import CategoryPicker from '../components/CategoryPicker';

const STATUS_OPTIONS = [
  { value: 'looking', label: 'מחפש שותפים' },
  { value: 'active', label: 'פעיל' },
  { value: 'completed', label: 'הושלם' },
];

const ROLE_SUGGESTIONS = ['מפתח', 'מעצב', 'משווק', 'מנהל מוצר', 'יזם', 'מנהל פרויקט', 'אנליסט'];

export default function ProjectForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('looking');
  const [categories, setCategories] = useState([]);
  const [lookingFor, setLookingFor] = useState([]);
  const [roleInput, setRoleInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = 'שם הפרויקט נדרש';
    else if (title.trim().length > 100) errs.title = 'מקסימום 100 תווים';
    if (!description.trim()) errs.description = 'תיאור הפרויקט נדרש';
    else if (description.trim().length > 3000) errs.description = 'מקסימום 3000 תווים';
    return errs;
  }

  function addRole(role) {
    const r = role.trim();
    if (!r || lookingFor.includes(r)) return;
    setLookingFor([...lookingFor, r]);
    setRoleInput('');
  }

  function removeRole(role) {
    setLookingFor(lookingFor.filter((r) => r !== role));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const newId = await db.addDoc('projects', {
        title: title.trim(),
        description: description.trim(),
        status,
        categories,
        lookingFor,
        createdBy: user.uid,
        createdByName: user.first + ' ' + user.last,
        members: [user.uid],
        memberCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      navigate('/projects/' + newId);
    } catch (err) {
      // Failed to create project
      setErrors({ submit: 'שגיאה ביצירת הפרויקט. נסה שוב.' });
      setSaving(false);
    }
  }

  return (
    <div style={s.body}>
      <button
        onClick={() => navigate('/projects')}
        style={{
          background: 'none',
          border: 'none',
          color: BLUE,
          cursor: 'pointer',
          fontSize: 14,
          padding: 0,
          marginBottom: '1rem',
        }}
      >
        → חזרה לפרויקטים
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 1rem', color: '#222' }}>
        פרויקט חדש
      </h1>

      <form onSubmit={handleSubmit}>
        <div style={s.card}>
          <FieldRow label="שם הפרויקט *">
            <input
              style={s.input}
              dir="auto"
              placeholder="שם הפרויקט"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <div style={s.err}>{errors.title}</div>}
          </FieldRow>

          <FieldRow label="תיאור *">
            <textarea
              style={{ ...s.textarea, minHeight: 120 }}
              dir="auto"
              placeholder="ספר/י על הפרויקט — מה הרעיון, מה המטרה, באיזה שלב אתם..."
              maxLength={3000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div style={{ fontSize: 11, color: '#aaa', textAlign: 'left', marginTop: 2 }}>
              {description.length}/3000
            </div>
            {errors.description && <div style={s.err}>{errors.description}</div>}
          </FieldRow>

          <FieldRow label="סטטוס">
            <select style={s.input} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FieldRow>

          <FieldRow label="תחומים (עד 4)">
            <CategoryPicker value={categories} onChange={setCategories} />
          </FieldRow>

          <FieldRow label="מחפשים (תפקידים)">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {ROLE_SUGGESTIONS.filter((r) => !lookingFor.includes(r)).map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => addRole(role)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    cursor: 'pointer',
                    border: '0.5px solid #ccc',
                    background: '#fff',
                    color: '#444',
                  }}
                >
                  + {role}
                </button>
              ))}
            </div>

            {lookingFor.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {lookingFor.map((role) => (
                  <span
                    key={role}
                    style={{
                      ...s.tag,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 10px',
                    }}
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() => removeRole(role)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: BLUE_DK,
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ ...s.input, flex: 1 }}
                dir="auto"
                placeholder="הוסף תפקיד..."
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRole(roleInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addRole(roleInput)}
                disabled={!roleInput.trim()}
                style={{
                  padding: '7px 14px',
                  background: BLUE,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  opacity: !roleInput.trim() ? 0.5 : 1,
                }}
              >
                הוסף
              </button>
            </div>
          </FieldRow>

          {errors.submit && <div style={{ ...s.err, marginBottom: 8 }}>{errors.submit}</div>}

          <button
            type="submit"
            disabled={saving}
            style={{
              ...s.btnPrimary,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'יוצר...' : 'צור פרויקט'}
          </button>
        </div>
      </form>
    </div>
  );
}
