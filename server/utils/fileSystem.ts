import { existsSync, mkdirSync } from "node:fs";

export const ensureDirectory = (dirPath: string) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

export const ensureDirectories = (dirs: string[]) => {
  dirs.forEach((dir) => ensureDirectory(dir));
};
