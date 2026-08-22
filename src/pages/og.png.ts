import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import { getSite } from '../lib/content';

/**
 * Social preview card (1200×630 PNG) rendered at build time with Satori:
 * site name over the dark canvas with Linear-style typography and accents.
 * Fonts come from the Fontsource CDN (TTF); falls back to Inter if Geist
 * is unavailable.
 */

type StyleProps = Record<string, string | number>;
interface TreeNode {
  type: string;
  props: { style?: StyleProps; children?: string | TreeNode | TreeNode[] };
}

async function fetchFont(pkg: 'geist' | 'inter', weight: 400 | 600): Promise<{ name: string; data: ArrayBuffer; weight: number }> {
  const url = `https://cdn.jsdelivr.net/fontsource/fonts/${pkg}@latest/latin-${weight}-normal.ttf`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font fetch failed (${res.status}): ${url}`);
  const family = pkg === 'geist' ? 'Geist' : 'Inter';
  return { name: family, data: await res.arrayBuffer(), weight };
}

function ogTree(name: string, role: string): TreeNode {
  return {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        backgroundColor: '#010102',
        fontFamily: 'Geist',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '14px' },
            children: [
              { type: 'div', props: { style: { display: 'flex', width: '30px', height: '2px', backgroundColor: '#5e6ad2' } } },
              { type: 'div', props: { style: { color: '#8a8f98', fontSize: '22px', letterSpacing: '4px', textTransform: 'uppercase' }, children: role } },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: { color: '#f7f8f8', fontSize: '96px', fontWeight: 600, letterSpacing: '-3px', lineHeight: 1.05 },
            children: name,
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '32px' },
            children: [
              {
                type: 'div',
                props: {
                  style: { color: '#d0d6e0', fontSize: '26px', lineHeight: 1.4, maxWidth: '700px' },
                  children: 'Portfolio personal · Proyectos, experiencia y certificaciones.',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    padding: '12px 26px',
                    border: '1px solid #34343a',
                    borderRadius: '9999px',
                    color: '#8a8f98',
                    fontSize: '21px',
                  },
                  children: 'meperfolio.vercel.app',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export const GET: APIRoute = async () => {
  const site = (await getSite('es'))[0].data;

  type SatoriFont = { name: string; data: ArrayBuffer; weight: number };
  let fonts: SatoriFont[];
  try {
    fonts = await Promise.all([fetchFont('geist', 400), fetchFont('geist', 600)]);
  } catch {
    fonts = await Promise.all([fetchFont('inter', 400), fetchFont('inter', 600)]);
  }

  // Satori's own typings assume a JSX runtime; at runtime a plain tree works.
  const renderSatori = satori as (node: unknown, options: { width: number; height: number; fonts: SatoriFont[] }) => Promise<string>;
  const svg = await renderSatori(ogTree(site.name, site.role), { width: 1200, height: 630, fonts });

  const png = new Resvg(svg).render().asPng();
  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
};
