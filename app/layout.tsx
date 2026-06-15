export const metadata = {
  title: 'SRT to Myanmar Translator',
  description: 'Translate SRT subtitles to Myanmar (Burmese)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>{children}</body>
    </html>
  );
}
