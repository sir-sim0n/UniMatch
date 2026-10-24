const paths={
 home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
 discover:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M16 8l-3 5-5 3 3-5 5-3',
 connections:'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-2a7 7 0 0 1 14 0v2M17 5a4 4 0 0 1 0 8M22 21v-2a7 7 0 0 0-4-6',
 messages:'M21 11a9 8 0 0 1-9 8H6l-4 3 1-7a8 8 0 0 1 0-8 9 8 0 0 1 18 4',
 circles:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10',
 saved:'M6 3h12v18l-6-4-6 4V3',profile:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-2a8 7 0 0 1 16 0v2',
 accounts:'M3 7h17l-4-4M21 17H4l4 4',upvote:'M12 21V3M5 10l7-7 7 7',share:'M12 16V3M7 8l5-5 5 5M5 13H3v8h18v-8h-2',refresh:'M20 8a8 8 0 1 0 0 8M20 3v5h-5',menu:'M4 6h16M4 12h16M4 18h16',filter:'M4 6h16M7 12h10M10 18h4'
};
export function icon(name){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','20');svg.setAttribute('height','20');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.classList.add('ui-icon');path.setAttribute('d',paths[name]??paths.messages);svg.append(path);return svg;}
