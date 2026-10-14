import React from "react";
import { Link } from "react-router-dom";

// Guide copy uses a tiny inline markup: [label](/path or https://url) and **bold**.
// server.js renders the same markup to HTML for crawlers (see renderInline there).
const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;

export function inline(text = "") {
  const out = [];
  let last = 0;
  let m;
  let k = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      const href = m[2];
      out.push(
        href.startsWith("/") ? (
          <Link key={k++} to={href} className="font-semibold text-[#C24E00] underline decoration-2 underline-offset-2 hover:text-[#FF6B00]">{m[1]}</Link>
        ) : (
          <a key={k++} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#C24E00] underline decoration-2 underline-offset-2 hover:text-[#FF6B00]">{m[1]}</a>
        )
      );
    } else {
      out.push(<strong key={k++} className="font-bold text-[#0A0A0A]">{m[3]}</strong>);
    }
    last = TOKEN.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Plain text (markup stripped) for meta descriptions and JSON-LD answers.
export function plain(text = "") {
  return text.replace(TOKEN, (_, label, _href, bold) => label || bold || "");
}
