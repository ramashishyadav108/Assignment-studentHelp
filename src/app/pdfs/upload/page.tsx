'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, BookOpen, Loader2 } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

export default function UploadPDFPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', subject);
      formData.append('grade', grade);

      const response = await fetch('/api/pdfs/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload PDF');
      }

      router.push(`/pdfs/${data.pdf.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 py-8 pb-12 min-h-[calc(100vh-120px)]">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Upload PDF</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">PDF File *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="pdf-upload"
                required
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">PDF files only</p>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="subject" className="block text-sm font-medium mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Physics, Chemistry, Mathematics"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="grade" className="block text-sm font-medium mb-2">
              Grade/Class
            </label>
            <input
              type="text"
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g., Class 11, Class 12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Upload PDF
                </>
              )}
            </button>
            <Link
              href="/pdfs"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
