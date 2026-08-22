// Stable per-technology accent hue: a tiny string hash maps each tech name to
// one of six curated hues, so ".NET" always lands on the same color across
// sections and locales while a stack list gets natural variety.
const HUES = ['#8b93ff', '#6fd3e8', '#62d9a3', '#e6c069', '#f0907e', '#d98fd6'] as const;

export function tagHue(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return HUES[hash % HUES.length];
}
