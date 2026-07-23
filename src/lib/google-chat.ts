/**
 * Client-side helper that calls our server API endpoint (/api/google-chat)
 * to send daily task reports to Google Chat without CORS issues.
 */

export interface TaskItemPayload {
  work_type: string;
  task_performed: string;
  status: string;
  remarks?: string | null;
}

export interface SendGoogleChatParams {
  webhookUrl?: string;
  employeeName: string;
  employeeId: string;
  date: string;
  tasks: TaskItemPayload[];
}

export async function sendGoogleChatNotification(params: SendGoogleChatParams) {
  // Retrieve webhook URL from localStorage if not passed explicitly
  const savedWebhook =
    params.webhookUrl ||
    (typeof window !== 'undefined' ? localStorage.getItem('qa-google-chat-webhook') : null) ||
    '';

  try {
    const response = await fetch('/api/google-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl: savedWebhook,
        employeeName: params.employeeName,
        employeeId: params.employeeId,
        date: params.date,
        tasks: params.tasks,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return { success: true, count: data.count };
    } else {
      return { success: false, error: data.error || 'Failed to send notification' };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network connection error',
    };
  }
}
