import React from 'react';
import { Moon, Sun } from 'lucide-react';

// Tombol ganti tema terang / gelap.
export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark';
  return (
    <button className="theme-btn" onClick={onToggle} aria-label={dark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'} title={dark ? 'Tema terang' : 'Tema gelap'}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
