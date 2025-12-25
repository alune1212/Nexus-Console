import path from 'path';

export default {
  // 前端文件
  'apps/web/**/*.{ts,tsx}': (filenames) => {
    const repoRoot = process.cwd();
    const webRoot = path.resolve(repoRoot, 'apps/web');
    const fileList = filenames.map((f) => {
      const absolutePath = f.startsWith('/') ? f : path.resolve(repoRoot, f);
      const relative = path.relative(webRoot, absolutePath);
      return relative;
    });

    return [`pnpm --filter web exec eslint --fix ${fileList.join(' ')}`];
  },

  // 后端文件
  'apps/api/**/*.py': (filenames) => {
    const repoRoot = process.cwd();
    const apiRoot = path.resolve(repoRoot, 'apps/api');
    const fileList = filenames.map((f) => {
      const absolutePath = f.startsWith('/') ? f : path.resolve(repoRoot, f);
      const relative = path.relative(apiRoot, absolutePath);
      return relative;
    });

    const filesString = fileList.join(' ');

    const commands = [
      `pnpm --filter api exec -- uv run ruff check --fix ${filesString}`,
      `pnpm --filter api exec -- uv run ruff format ${filesString}`,
    ];

    return commands;
  },
};

