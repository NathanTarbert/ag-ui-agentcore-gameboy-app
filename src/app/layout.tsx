import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GB Kanban | AgentCore + CopilotKit",
  description: "A Game Boy styled Kanban board powered by AG-UI and Amazon Bedrock AgentCore",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
