'use client';

import { TaskForm } from '@/components/forms/task-form';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto">
      <TaskForm
        onSuccess={() => {
          // Smooth redirect to dashboard without full page reload
          router.push('/dashboard');
        }}
      />
    </div>
  );
}
