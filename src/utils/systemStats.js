import si from 'systeminformation';
import os from 'os';

export async function getSystemMetrics() {
  try {
    const [cpuLoad, mem, fsSize] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize()
    ]);

    const totalMem = mem.total;
    const freeMem = mem.free;
    const usedMem = mem.active;
    const ramUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

    const rootDisk = fsSize.find(f => f.mount === '/' || f.mount === 'C:') || fsSize[0] || {
      size: 0,
      used: 0,
      use: 0
    };

    return {
      uptimeSeconds: Math.floor(os.uptime()),
      cpu: {
        usagePercent: cpuLoad.currentLoad.toFixed(1),
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Generic CPU'
      },
      ram: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: ramUsagePercent
      },
      disk: {
        total: rootDisk.size,
        used: rootDisk.used,
        free: rootDisk.size - rootDisk.used,
        usagePercent: (rootDisk.use || 0).toFixed(1)
      },
      platform: os.platform(),
      arch: os.arch()
    };
  } catch (error) {
    return {
      uptimeSeconds: Math.floor(os.uptime()),
      cpu: { usagePercent: '0.0', cores: os.cpus().length, model: 'Unknown' },
      ram: { total: os.totalmem(), used: os.totalmem() - os.freemem(), free: os.freemem(), usagePercent: '0.0' },
      disk: { total: 0, used: 0, free: 0, usagePercent: '0.0' },
      platform: os.platform(),
      arch: os.arch(),
      error: error.message
    };
  }
}
