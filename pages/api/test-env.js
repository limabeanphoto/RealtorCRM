// pages/api/test-env.js
export default function handler(req, res) {
  res.status(200).json({ url: process.env.POSTGRES_PRISMA_URL });
}