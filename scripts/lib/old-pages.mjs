// Reads the project arrays out of the pre-change pages at a pinned commit.
import { execFileSync } from 'node:child_process';

export const BASE_SHA = '39b5c50';

function frontmatter(path) {
  const src = execFileSync('git', ['show', `${BASE_SHA}:${path}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  return m[1].replace(/^import .*$/gm, '').replace(/ as const/g, '');
}

export function oldPages() {
  const run = (path, names) => new Function(`${frontmatter(path)}\nreturn { ${names} };`)();
  const { projects } = run('src/pages/projects.astro', 'projects');
  const { advocacyProjects, communityProjects, personalProjects } = run(
    'src/pages/ai.astro',
    'advocacyProjects, communityProjects, personalProjects',
  );
  return { projects, advocacyProjects, communityProjects, personalProjects };
}
