'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.srt')) {
      alert('Please upload .srt file');
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setContent(e.target?.result as string);
    reader.readAsText(file, 'UTF-8');
  };

  const translate = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srtContent: content }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.translatedSRT);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Translation failed');
    }
    setLoading(false);
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name.replace('.srt', '') || 'subtitle') + '_myanmar.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>🇲🇲 SRT to Myanmar Translator</h1>
      <p>Using OpenAI with Auto Key Switching</p>
      
      <div style={{ border: '2px dashed #ccc', borderRadius: 16, padding: 40, textAlign: 'center', cursor: 'pointer', margin: '20px 0', background: '#f9f9f9' }}
        onClick={() => document.getElementById('fileInput')?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
        📂 Click or Drag .srt file here
        <input id="fileInput" type="file" accept=".srt" style={{ display: 'none' }} onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
      </div>
      
      {file && <div style={{ background: '#e3f2fd', padding: 12, borderRadius: 8, marginBottom: 16 }}>📄 {file.name}</div>}
      
      <button onClick={translate} disabled={!content || loading} style={{ padding: '12px 32px', fontSize: 16, borderRadius: 40, border: 'none', background: '#667eea', color: 'white', cursor: 'pointer', marginBottom: 20 }}>
        {loading ? 'Translating...' : 'Translate to Myanmar'}
      </button>
      
      {result && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>📝 Translated (မြန်မာလို)</strong>
            <button onClick={download} style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: 8 }}>💾 Download SRT</button>
          </div>
          <textarea value={result} readOnly rows={15} style={{ width: '100%', padding: 12, fontFamily: 'monospace', borderRadius: 12, border: '1px solid #ddd' }} />
        </div>
      )}
    </div>
  );
}
