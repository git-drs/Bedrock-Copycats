// fetch.mjs - cached, ETag-aware downloader. Cache lives in datagen/cache (git-ignored).
import { promises as fs } from "node:fs";
import path from "node:path";
import { sha1, sha256, exists } from "./util.mjs";

export class Downloader {
  constructor({ cacheDir, offline = false, refresh = false }) {
    this.cacheDir = cacheDir;
    this.offline = offline;
    this.refresh = refresh;
    this.stats = { network: 0, cached: 0, revalidated: 0 };
  }

  _paths(url) {
    const key = sha1(url);
    return { body: path.join(this.cacheDir, key + ".bin"), meta: path.join(this.cacheDir, key + ".meta.json") };
  }

  /**
   * Returns a Buffer, or null on 404 when allow404 is set.
   * immutable: once cached, never revalidate (used for texture images; --refresh overrides).
   */
  async buffer(url, { allow404 = false, immutable = false } = {}) {
    await fs.mkdir(this.cacheDir, { recursive: true });
    const { body, meta: metaPath } = this._paths(url);
    let meta = null;
    if (await exists(body) && await exists(metaPath)) {
      try { meta = JSON.parse(await fs.readFile(metaPath, "utf8")); } catch { meta = null; }
    }
    const fromCache = async () => {
      this.stats.cached++;
      if (meta.status === 404) { if (allow404) return null; throw new Error(`HTTP 404 for ${url} (cached)`); }
      return fs.readFile(body);
    };
    if (meta && (this.offline || (immutable && !this.refresh))) return fromCache();
    if (this.offline) {
      if (allow404) return null;
      throw new Error(`Offline mode: ${url} is not in the cache. Run once online first.`);
    }

    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const headers = { "user-agent": "bedrock-copycats-datagen" };
        if (meta?.status === 200 && meta.etag && !this.refresh) headers["if-none-match"] = meta.etag;
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(60000) });
        if (res.status === 304 && meta) { this.stats.revalidated++; return fromCache(); }
        if (res.status === 404) {
          await fs.writeFile(body, Buffer.alloc(0));
          await fs.writeFile(metaPath, JSON.stringify({ url, status: 404 }));
          this.stats.network++;
          if (allow404) return null;
          throw new Error(`HTTP 404 for ${url}`);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await fs.writeFile(body, buf);
        await fs.writeFile(metaPath, JSON.stringify({ url, status: 200, etag: res.headers.get("etag") || null, sha256: sha256(buf) }));
        this.stats.network++;
        return buf;
      } catch (e) {
        lastErr = e;
        if (/HTTP 404/.test(e.message)) throw e;
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
    if (meta) {
      console.warn(`  ! network failed for ${url} (${lastErr.message}); using cached copy`);
      return fromCache();
    }
    throw new Error(`Failed to download ${url}: ${lastErr?.message}`);
  }

  async text(url, opts) {
    const b = await this.buffer(url, opts);
    return b === null ? null : b.toString("utf8");
  }

  async json(url, opts) {
    const t = await this.text(url, opts);
    return t === null ? null : JSON.parse(t.replace(/^\uFEFF/, ""));
  }
}
