This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- 📄 **PDF Processing**: Upload and chat with PDF documents using AI
- 💬 **AI Chatbot**: Gemini-powered conversational assistant
- 📊 **Quiz Generation**: Auto-generate quizzes from PDFs
- 🎥 **YouTube Integration**: Get personalized video recommendations
- 🔐 **Authentication**: Secure user management with Clerk
- ☁️ **Cloud Storage**: PDFs stored on Cloudinary for scalability

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- PostgreSQL database
- Accounts for:
  - [Clerk](https://clerk.dev) (Authentication)
  - [Google AI Studio](https://makersuite.google.com/app/apikey) (Gemini API)
  - [Cloudinary](https://cloudinary.com) (File storage)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then update the following variables:

#### **Database Configuration**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

#### **Clerk Authentication**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy your keys from the "API Keys" section:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

#### **Google Gemini AI**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add it to your `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key
```

#### **Cloudinary (Required for PDF Storage - Mandatory)**
⚠️ **Important**: This app uses Cloudinary exclusively for PDF storage. Without proper Cloudinary configuration, PDF uploads will not work.

1. Sign up at [Cloudinary](https://cloudinary.com/users/register/free) (Free tier: 25 GB storage)
2. Go to your [Dashboard](https://console.cloudinary.com/)
3. Find your credentials in the "Account Details" section:
   - **Cloud Name**: Found at the top
   - **API Key**: Listed under "API Keys"
   - **API Secret**: Click "Reveal" to see it

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

📖 **Detailed Setup Guide**: See [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md) for comprehensive instructions.

### 3. Database Setup

Run Prisma migrations to set up your database:

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Vercel deployment checklist

When deploying to Vercel, make sure to add these environment variables in your Project Settings -> Environment Variables. Set the ones that are server-only as `Environment Variable` (not exposed as NEXT_PUBLIC).

- DATABASE_URL (server-only)
- CLERK_SECRET_KEY (server-only)
- CLERK_WEBHOOK_SECRET (server-only) — required for Clerk webhooks
- CLOUDINARY_CLOUD_NAME (server-only)
- CLOUDINARY_API_KEY (server-only)
- CLOUDINARY_API_SECRET (server-only)
- GEMINI_API_KEY (server-only)
- YOUTUBE_API_KEY (can be NEXT_PUBLIC if used client-side)
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (public)
- NEXT_PUBLIC_APP_URL (public) — set to your Vercel URL, e.g. https://your-project.vercel.app

After adding the variables, redeploy the project (Trigger a new deployment from the Vercel dashboard or push a new commit). If you see 500 errors on API routes, check the Vercel function logs (Project -> Functions) for stack traces and missing env variables.
