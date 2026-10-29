
type MessageActionResponse = {
  success?: boolean;
  message?: string;
};

async function requestMessageAction(
  apiUrl: string,
  messageId: number,
  token: string,
  method: "PATCH" | "DELETE",
  content?: string
): Promise<MessageActionResponse> {
  const response = await fetch(
    `${apiUrl}/api/messages/${messageId}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "PATCH"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(method === "PATCH"
        ? { body: JSON.stringify({ content }) }
        : {}),
    }
  );

  const data: MessageActionResponse = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Message action fail ho gaya."
    );
  }

  return data;
}

export function editMessage(
  apiUrl: string,
  messageId: number,
  content: string,
  token: string
) {
  return requestMessageAction(
    apiUrl,
    messageId,
    token,
    "PATCH",
    content
  );
}

export function deleteMessage(
  apiUrl: string,
  messageId: number,
  token: string
) {
  return requestMessageAction(
    apiUrl,
    messageId,
    token,
    "DELETE"
  );
}
