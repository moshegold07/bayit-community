import { readFileSync } from 'fs';
import { GoogleAuth } from 'google-auth-library';

const sa = JSON.parse(readFileSync(new URL('./bait-sa.json', import.meta.url), 'utf8'));
const gauth = new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'] });
const client = await gauth.getClient();
const token = await client.getAccessToken();

const res = await fetch('https://identitytoolkit.googleapis.com/admin/v2/projects/bait-de724/config', {
  headers: { Authorization: 'Bearer ' + token.token }
});
const data = await res.json();
console.log(JSON.stringify(data, null, 2));
process.exit(0);
