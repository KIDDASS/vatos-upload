export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });


const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const UPLOAD_PASSWORD = process.env.UPLOAD_PASSWORD || 'vatospermup';
const BRANCH = process.env.BRANCH || 'main';
const UPLOAD_PATH = process.env.UPLOAD_PATH || 'gallery';


if (!GITHUB_TOKEN || !GITHUB_REPO) {
return res.status(500).json({ error: 'Server misconfigured: set GITHUB_TOKEN and GITHUB_REPO in env' });
}


try {
const { filename, content, password } = req.body || {};
if (!filename || !content) return res.status(400).json({ error: 'Missing filename/content' });
if (password !== UPLOAD_PASSWORD) return res.status(401).json({ error: 'Invalid password' });


const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
const ts = new Date().toISOString().replace(/[:.]/g, '-');
const path = `${UPLOAD_PATH}/${ts}-${safeName}`;


const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`;


const body = {
message: `Upload ${safeName} to gallery`,
content: content,
branch: BRANCH
};


const apiRes = await fetch(url, {
method: 'PUT',
headers: {
Authorization: `token ${GITHUB_TOKEN}`,
'Content-Type': 'application/json',
Accept: 'application/vnd.github+json'
},
body: JSON.stringify(body)
});


const json = await apiRes.json();
if (!apiRes.ok) return res.status(apiRes.status).json({ error: json.message || json });


const fileInfo = {
path: json.content.path,
sha: json.content.sha,
html_url: json.content.html_url
};


return res.status(200).json(fileInfo);
} catch (err) {
console.error(err);
return res.status(500).json({ error: err.message || String(err) });
}
}
