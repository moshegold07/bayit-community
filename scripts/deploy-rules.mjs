import { GoogleAuth } from 'google-auth-library';
import { readFile } from 'node:fs/promises';

const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const PROJECT_ID = 'bayit-community';

const rulesText = await readFile('firestore.rules', 'utf8');

const auth = new GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
const client = await auth.getClient();

const createRes = await client.request({
  url: `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
  method: 'POST',
  data: {
    source: {
      files: [{ name: 'firestore.rules', content: rulesText }],
    },
  },
});
const rulesetName = createRes.data.name;
console.log('Created ruleset:', rulesetName);

const releaseRes = await client.request({
  url: `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore`,
  method: 'PATCH',
  data: {
    release: {
      name: `projects/${PROJECT_ID}/releases/cloud.firestore`,
      rulesetName,
    },
  },
});
console.log('Released:', releaseRes.data.name, '→', releaseRes.data.rulesetName);
