import { json } from '@sveltejs/kit';

export async function GET() {
  const r = await fetch('https://startcode-hackathon2025.azurewebsites.net/api/getproducts');
  if (!r.ok) return json({ error: 'upstream error' }, { status: r.status });
  const data = await r.json();
  return json(data);
}
