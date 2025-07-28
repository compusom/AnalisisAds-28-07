# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file based on `.env.example` and set the
   required environment variables:
   - `VITE_GEMINI_API_KEY`
   - `VITE_DB_HOST`
   - `VITE_DB_USER`
   - `VITE_DB_PASS`
   - `VITE_DB_NAME`
   - `VITE_DB_PORT`
3. Run the app:
   `npm run dev`
