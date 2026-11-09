import React from 'react';
import { ClipboardList, CakeSlice, MessageCircle, BadgeCheck } from 'lucide-react';

const icons = [CakeSlice, ClipboardList, MessageCircle, BadgeCheck];

// Ringkasan cara pesan di beranda (isi diambil dari `steps` di data.js).
export default function StepsStrip({ steps, href }) {
  return (
    <section className="howto">
      <div className="section-heading" data-reveal>
        <span className="eyebrow">Mudah &amp; cepat</span>
        <h2>Pesan dalam <em>4 langkah</em></h2>
      </div>
      <ol className="howto-row">
        {steps.map((s, i) => {
          const Icon = icons[i % icons.length];
          return (
            <li key={s.title} data-reveal>
              <span className="howto-ico"><Icon size={24} /></span>
              <i className="howto-no">0{i + 1}</i>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          );
        })}
      </ol>
      <a className="see-all howto-link" href={href}>Lihat panduan lengkap →</a>
    </section>
  );
}
