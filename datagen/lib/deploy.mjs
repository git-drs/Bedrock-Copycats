// deploy.mjs - sync behavior and resource packs to games/com.mojang development folders
import path from "node:path";
import { promises as fs } from "node:fs";
import { spawnSync } from "node:child_process";
import { exists, walk, pruneEmptyDirs, log, posix } from "./util.mjs";

/** Candidate paths for games/com.mojang */
function getCandidates(explicitTarget) {
  const candidates = [];
  if (explicitTarget && explicitTarget !== "auto") candidates.push(explicitTarget);
  if (process.env.MINECRAFT_MOJANG_DIR) candidates.push(process.env.MINECRAFT_MOJANG_DIR);
  if (process.env.COM_MOJANG_PATH) candidates.push(process.env.COM_MOJANG_PATH);

  // Common Android / Termux paths
  candidates.push(
    "/data/data/com.termux/files/home/storage/shared/games/com.mojang",
    "/storage/emulated/0/games/com.mojang",
    "/sdcard/games/com.mojang",
    "/storage/emulated/0/Android/data/com.mojang.minecraftpe/files/games/com.mojang",
    "/sdcard/Android/data/com.mojang.minecraftpe/files/games/com.mojang"
  );

  // Windows paths
  if (process.env.LOCALAPPDATA) {
    candidates.push(
      path.join(process.env.LOCALAPPDATA, "Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang")
    );
  }
  if (process.env.APPDATA) {
    candidates.push(path.join(process.env.APPDATA, "Minecraft Bedrock/games/com.mojang"));
  }

  // Linux / Flatpak
  if (process.env.HOME) {
    candidates.push(
      path.join(process.env.HOME, ".var/app/io.mrarm.mcpelauncher/data/mcpelauncher/games/com.mojang"),
      path.join(process.env.HOME, ".local/share/mcpelauncher/games/com.mojang")
    );
  }

  return candidates;
}

/** Resolve the games/com.mojang directory */
export async function findMojangDir(explicitTarget) {
  const candidates = getCandidates(explicitTarget);
  for (const c of candidates) {
    try {
      if (await exists(c)) {
        const stat = await fs.stat(c);
        if (stat.isDirectory()) return c;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/** Check if rsync is available on the system */
function hasRsync() {
  try {
    const res = spawnSync("rsync", ["--version"], { stdio: "ignore" });
    return res.status === 0;
  } catch {
    return false;
  }
}

/** Synchronize a directory using rsync */
function syncWithRsync(srcDir, dstDir, dryRun = false) {
  const src = srcDir.endsWith(path.sep) ? srcDir : srcDir + path.sep;
  // Use -rtO:
  //   -r recursive
  //   -t preserve times on files
  //   -O omit directory times (required on Android FUSE/FAT to prevent permission issues)
  //   --modify-window=2 handles FAT 2-second timestamp resolution
  const args = ["-rtO", "--modify-window=2", "--delete"];
  if (dryRun) args.push("--dry-run");
  args.push("--stats", src, dstDir);

  const res = spawnSync("rsync", args, { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(`rsync failed (exit ${res.status}): ${res.stderr || res.stdout}`);
  }

  const stdout = res.stdout || "";
  const matchTransferred = stdout.match(/Number of regular files transferred:\s*([\d,]+)/);
  const matchDeleted = stdout.match(/Number of deleted files:\s*([\d,]+)/);
  const transferred = matchTransferred ? Number(matchTransferred[1].replace(/,/g, "")) : 0;
  const deleted = matchDeleted ? Number(matchDeleted[1].replace(/,/g, "")) : 0;
  return { transferred, deleted };
}

/** Pure Node fallback for directory mirroring */
async function syncWithNode(srcDir, dstDir, dryRun = false) {
  await fs.mkdir(dstDir, { recursive: true });

  const srcFiles = await walk(srcDir);
  const dstFiles = await walk(dstDir);

  const srcMap = new Map();
  for (const f of srcFiles) {
    const rel = posix(path.relative(srcDir, f));
    srcMap.set(rel, f);
  }

  const dstMap = new Map();
  for (const f of dstFiles) {
    const rel = posix(path.relative(dstDir, f));
    dstMap.set(rel, f);
  }

  let transferred = 0;
  let deleted = 0;

  for (const [rel, srcPath] of srcMap) {
    const dstPath = path.join(dstDir, rel);
    let needCopy = false;

    if (!dstMap.has(rel)) {
      needCopy = true;
    } else {
      const [srcStat, dstStat] = await Promise.all([fs.stat(srcPath), fs.stat(dstPath)]);
      if (srcStat.size !== dstStat.size || Math.abs(srcStat.mtimeMs - dstStat.mtimeMs) > 2000) {
        needCopy = true;
      }
    }

    if (needCopy) {
      transferred++;
      if (!dryRun) {
        await fs.mkdir(path.dirname(dstPath), { recursive: true });
        await fs.copyFile(srcPath, dstPath);
        const srcStat = await fs.stat(srcPath);
        try {
          await fs.utimes(dstPath, srcStat.atime, srcStat.mtime);
        } catch {
          // ignore timestamp failure if filesystem does not permit utimes
        }
      }
    }
  }

  for (const [rel, dstPath] of dstMap) {
    if (!srcMap.has(rel)) {
      deleted++;
      if (!dryRun) {
        await fs.rm(dstPath, { force: true });
      }
    }
  }

  if (!dryRun) {
    await pruneEmptyDirs(dstDir);
  }

  return { transferred, deleted };
}

/** Sync a single pack directory */
async function syncPack(srcDir, dstDir, dryRun = false) {
  if (hasRsync()) {
    try {
      return syncWithRsync(srcDir, dstDir, dryRun);
    } catch {
      // Fallback to pure Node if rsync fails
      return await syncWithNode(srcDir, dstDir, dryRun);
    }
  }
  return await syncWithNode(srcDir, dstDir, dryRun);
}

/** Deploy packs to games/com.mojang development folders */
export async function deployPacks({ root, cfg, targetDir, dryRun = false, quiet = false }) {
  const mojangDir = targetDir || (await findMojangDir(cfg.deploy?.targetDir));
  if (!mojangDir) {
    if (!quiet) {
      log.warn(
        "com.mojang folder not found; skipped auto-deploy.\n" +
        "    Set deploy.targetDir in datagen/config.json or define MINECRAFT_MOJANG_DIR"
      );
    }
    return { ok: false, reason: "not_found" };
  }

  const bpSrc = path.join(root, cfg.paths.bp);
  const rpSrc = path.join(root, cfg.paths.rp);

  const bpDst = path.join(mojangDir, "development_behavior_packs", path.basename(cfg.paths.bp));
  const rpDst = path.join(mojangDir, "development_resource_packs", path.basename(cfg.paths.rp));

  if (!dryRun) {
    await fs.mkdir(bpDst, { recursive: true });
    await fs.mkdir(rpDst, { recursive: true });
  }

  log.step(dryRun ? "Checking deployment to games/com.mojang (dry-run)" : "Deploying packs to games/com.mojang");
  log.info(`  com.mojang: ${mojangDir}`);

  const bpResult = await syncPack(bpSrc, bpDst, dryRun);
  log.info(`  ✓ BP -> development_behavior_packs/${path.basename(cfg.paths.bp)} (${bpResult.transferred} updated, ${bpResult.deleted} deleted)`);

  const rpResult = await syncPack(rpSrc, rpDst, dryRun);
  log.info(`  ✓ RP -> development_resource_packs/${path.basename(cfg.paths.rp)} (${rpResult.transferred} updated, ${rpResult.deleted} deleted)`);

  return {
    ok: true,
    mojangDir,
    bp: { dest: bpDst, ...bpResult },
    rp: { dest: rpDst, ...rpResult },
  };
}
