import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen, MessageSquare } from "lucide-react";

export default async function ChatPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Chat Assistant</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Chat with AI to ask questions about your coursebooks. Get answers
              with exact page references.
            </p>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <p className="text-gray-700">
                Chat feature coming soon! This will provide:
              </p>
              <ul className="mt-4 text-left space-y-2 text-gray-600">
                <li>• RAG-based answers with page citations</li>
                <li>• PDF context understanding</li>
                <li>• Video recommendations</li>
                <li>• Chat history</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
