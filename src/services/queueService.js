import logger from '../config/logger.js';

class DownloadQueue {
  constructor(concurrency = 4) {
    this.concurrency = concurrency;
    this.activeCount = 0;
    this.queue = [];
  }

  enqueue(taskFunction) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFunction, resolve, reject });
      this.processNext();
    });
  }

  processNext() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { taskFunction, resolve, reject } = this.queue.shift();
    this.activeCount++;

    logger.info(`Queue status: Active downloads ${this.activeCount}/${this.concurrency} | Waiting in queue: ${this.queue.length}`);

    Promise.resolve()
      .then(() => taskFunction())
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.activeCount--;
        this.processNext();
      });
  }
}

export const downloadQueue = new DownloadQueue(4);
