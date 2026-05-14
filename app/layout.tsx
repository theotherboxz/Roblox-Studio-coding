import type {Metadata} from 'next';
import './globals.css'; // Global styles
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Roblox Studio Web AI',
  description: 'Roblox Studio Web clone with an integrated AI agent capable of writing scripts and modifying the workspace.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-[#1b1b1b] text-[#e8e8e8] h-screen w-screen overflow-hidden m-0">
        <Script src="https://js.puter.com/v2/" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
