/**
 * Utility to send formatted daily task reports to a Google Chat Space via Incoming Webhook.
 */

interface TaskNotificationParams {
  employeeName: string;
  employeeId: string;
  date: string;
  workType: string;
  taskPerformed: string;
  status: string;
  remarks?: string | null;
}

export async function sendGoogleChatNotification(params: TaskNotificationParams) {
  // Get webhook URL from environment variable or localStorage setting
  const webhookUrl =
    process.env.NEXT_PUBLIC_GOOGLE_CHAT_WEBHOOK_URL ||
    (typeof window !== 'undefined' ? localStorage.getItem('qa-google-chat-webhook') : null);

  if (!webhookUrl) {
    console.log('Google Chat Webhook URL not configured. Skipping notification.');
    return { success: false, reason: 'No Webhook URL configured' };
  }

  const { employeeName, employeeId, date, workType, taskPerformed, status, remarks } = params;

  // Format a rich Google Chat Card / Message
  const statusEmoji = status === 'Completed' ? '✅' : '⏳';
  const cardPayload = {
    cardsV2: [
      {
        cardId: `task-report-${Date.now()}`,
        card: {
          header: {
            title: `📋 QA Daily Task Report`,
            subtitle: `${employeeName} (${employeeId}) · ${date}`,
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/906/906343.png',
            imageType: 'CIRCLE',
          },
          sections: [
            {
              widgets: [
                {
                  keyValue: {
                    topLabel: 'QA Engineer',
                    content: `<b>${employeeName}</b> (${employeeId})`,
                    icon: 'PERSON',
                  },
                },
                {
                  keyValue: {
                    topLabel: 'Work Type & Status',
                    content: `<b>${workType}</b> &nbsp;|&nbsp; ${statusEmoji} <b>${status}</b>`,
                    icon: 'BOOKMARK',
                  },
                },
                {
                  textParagraph: {
                    text: `<b>Task Performed:</b><br>${taskPerformed.replace(/\n/g, '<br>')}`,
                  },
                },
                ...(remarks
                  ? [
                      {
                        textParagraph: {
                          text: `<i>Note / Remarks: ${remarks}</i>`,
                        },
                      },
                    ]
                  : []),
              ],
            },
          ],
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(cardPayload),
    });

    if (response.ok) {
      console.log('Google Chat notification sent successfully!');
      return { success: true };
    } else {
      const errText = await response.text();
      console.error('Google Chat Webhook Error:', errText);
      return { success: false, error: errText };
    }
  } catch (err) {
    console.error('Failed to trigger Google Chat notification:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Fetch failed' };
  }
}
