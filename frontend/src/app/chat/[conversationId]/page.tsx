
import { Suspense } from "react";
import ChatClient from "./ChatClient";

type ChatPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#080b14] text-white">
          Chat loading...
        </main>
      }
    >
      <ChatContent params={params} />
    </Suspense>
  );
}

async function ChatContent({ params }: ChatPageProps) {
  const { conversationId } = await params;

  return <ChatClient conversationId={conversationId} />;
}
