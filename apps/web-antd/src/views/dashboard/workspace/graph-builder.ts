// @ts-nocheck
export const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', '.idea', '.vscode',
  '.vs', '__pycache__', '.venv', 'venv', 'env', 'dist', 'build',
  'out', 'target', 'bin', 'obj', 'coverage', '.next', '.nuxt',
  '.cache', 'tmp', 'temp', 'logs', 'vendor',
]);

export const IGNORE_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib', '.o', '.class', '.jar',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.mp4', '.mp3', '.wav', '.mov', '.avi',
  '.woff', '.woff2', '.ttf', '.eot',
  '.db', '.sqlite', '.sqlite3',
  '.min.js', '.min.css', '.map',
  '.wasm', '.pyc', '.pyo',
]);

export const IGNORE_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'composer.lock', 'Gemfile.lock', 'Cargo.lock', 'go.sum',
  '.gitignore', '.DS_Store', 'Thumbs.db',
]);

export function shouldIgnorePath(filePath: string): boolean {
  const parts = filePath.replace(/\\/g, '/').split('/');
  for (const part of parts) {
    if (IGNORE_DIRS.has(part)) return true;
  }
  const fileName = parts[parts.length - 1];
  if (IGNORE_FILES.has(fileName)) return true;
  const dot = fileName.lastIndexOf('.');
  if (dot !== -1) {
    const ext = fileName.substring(dot).toLowerCase();
    if (IGNORE_EXTS.has(ext)) return true;
  }
  return false;
}

export interface GraphData {
  nodes: any[];
  relationships: any[];
}

export function buildGraphFromDirectory(files: { path: string; content: string }[]): GraphData {
  const nodes: any[] = [];
  const relationships: any[] = [];
  const pathToId = new Map<string, string>();
  let nodeSeq = 0;
  const nextId = () => `n${++nodeSeq}`;

  const projectName = files[0].path.split('/')[0];
  const projectId = nextId();
  nodes.push({ id: projectId, label: 'Project', properties: { name: projectName, filePath: projectName } });
  pathToId.set(projectName, projectId);

  const allDirs = new Set<string>();
  for (const f of files) {
    const parts = f.path.split('/');
    for (let i = 1; i < parts.length; i++) {
      allDirs.add(parts.slice(0, i).join('/'));
    }
  }

  const sortedDirs = [...allDirs].sort((a, b) => a.split('/').length - b.split('/').length);
  for (const dirPath of sortedDirs) {
    const dirId = nextId();
    const dirName = dirPath.split('/').pop() || dirPath;
    nodes.push({ id: dirId, label: 'Folder', properties: { name: dirName, filePath: dirPath } });
    pathToId.set(dirPath, dirId);

    const parentPath = dirPath.includes('/') ? dirPath.substring(0, dirPath.lastIndexOf('/')) : projectName;
    const parentId = pathToId.get(parentPath);
    if (parentId) {
      relationships.push({ id: `r${nextId()}`, type: 'CONTAINS', sourceId: parentId, targetId: dirId, confidence: 1, reason: 'hierarchy' });
    }
  }

  const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)|from\s+['"]([^'"]+)['"]\s+import|import\s+['"]([^'"]+)['"]|import\s+type\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]|import\s+type\s+(\w+)\s+from\s+['"]([^'"]+)['"])/g;

  for (const f of files) {
    const fileId = nextId();
    const fileName = f.path.split('/').pop() || f.path;
    nodes.push({ id: fileId, label: 'File', properties: { name: fileName, filePath: f.path } });
    pathToId.set(f.path, fileId);

    const dirPath = f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : projectName;
    const dirId = pathToId.get(dirPath);
    if (dirId) {
      relationships.push({ id: `r${nextId()}`, type: 'CONTAINS', sourceId: dirId, targetId: fileId, confidence: 1, reason: 'hierarchy' });
    }

    const ext = f.path.includes('.') ? f.path.split('.').pop()?.toLowerCase() : '';
    const codeExts = new Set(['js', 'ts', 'jsx', 'tsx', 'vue', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'swift', 'kt', 'scala']);
    if (!ext || !codeExts.has(ext)) continue;

    const content = f.content;

    const patterns: RegExp[] = [
      /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g,
      /(?:export\s+)?interface\s+(\w+)/g,
      /(?:export\s+)?(?:type|enum)\s+(\w+)/g,
      /(?:export\s+)?(?:default\s+)?function\s+(\w+)/g,
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
      /def\s+(\w+)\s*\(/g,
      /(?:public|private|protected)?\s*function\s+(\w+)/g,
      /(?:pub\s+)?fn\s+(\w+)/g,
      /func\s+(\w+)/g,
      /(?:public|private|protected)?\s+\w+\s+(\w+)\s*\([^)]*\)\s*\{/g,
    ];
    const foundSymbols = new Set<string>();
    for (const re of patterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        const symbolName = m[1];
        if (!symbolName || symbolName === 'default' || foundSymbols.has(symbolName)) continue;
        foundSymbols.add(symbolName);
        const symbolId = nextId();
        const label = m[0].includes('class') ? 'Class' :
          m[0].includes('interface') ? 'Interface' :
          m[0].includes('enum') ? 'Enum' :
          m[0].includes('type') ? 'Type' : 'Function';
        nodes.push({ id: symbolId, label, properties: { name: symbolName, filePath: f.path } });
        relationships.push({ id: `r${nextId()}`, type: 'DEFINES', sourceId: fileId, targetId: symbolId, confidence: 1, reason: 'code' });
      }
    }

    importRegex.lastIndex = 0;
    let impMatch;
    while ((impMatch = importRegex.exec(content)) !== null) {
      const impPath = impMatch[1] || impMatch[2] || impMatch[3] || impMatch[4] || impMatch[5] || impMatch[6] || impMatch[7];
      if (!impPath) continue;
      if (impPath.startsWith('.') || impPath.startsWith('/')) {
        const baseDir = f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : '';
        const resolved = resolveImportPath(baseDir, impPath, pathToId);
        if (resolved) {
          const targetId = pathToId.get(resolved)!;
          if (!relationships.some((r) => r.sourceId === fileId && r.targetId === targetId && r.type === 'IMPORTS')) {
            relationships.push({ id: `r${nextId()}`, type: 'IMPORTS', sourceId: fileId, targetId, confidence: 0.8, reason: 'import' });
          }
        }
      }
    }
  }

  return { nodes, relationships };
}

function resolveImportPath(baseDir: string, impPath: string, pathToId: Map<string, string>): string | null {
  const clean = impPath.replace(/['"]/g, '');
  const candidates = [
    clean,
    `${clean}.ts`, `${clean}.tsx`, `${clean}.js`, `${clean}.jsx`,
    `${clean}.vue`, `${clean}.mjs`, `${clean}.cjs`, `${clean}.mts`,
    `${clean}/index.ts`, `${clean}/index.tsx`, `${clean}/index.js`, `${clean}/index.jsx`,
    `${clean}/index.vue`, `${clean}/index.mjs`, `${clean}/index.cjs`,
  ];
  const paths = baseDir ? candidates.map((c) => `${baseDir}/${c}`) : candidates;
  for (const p of paths) {
    if (pathToId.has(p)) return p;
  }
  return null;
}