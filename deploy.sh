#!/bin/bash
set -e

echo "=== Upshift Deploy ==="
echo ""
echo "Before deploying, make sure you have:"
echo "  1. Run 'vercel login' (frontend)"
echo "  2. Connected GitHub repo to Render (backend)"
echo "  3. Set env vars in Vercel + Render dashboards"
echo ""

read -p "Deploy frontend to Vercel? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd frontend
  vercel --prod
  echo ""
  echo "Add these env vars in Vercel dashboard if not set:"
  echo "  VITE_SUPABASE_URL"
  echo "  VITE_SUPABASE_ANON_KEY"
  echo "  VITE_STRIPE_PUBLISHABLE_KEY"
  echo "  VITE_API_URL  (your Render backend URL)"
fi

echo ""
echo "Backend (Render):"
echo "  1. Push repo to GitHub"
echo "  2. render.com → New → Blueprint → connect repo (uses render.yaml)"
echo "     OR: New Web Service → root directory: backend"
echo "  3. Add env vars from backend/.env.example"
echo ""
echo "See ENV_SETUP.md for full key placement guide."
