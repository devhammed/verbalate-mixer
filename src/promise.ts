class AsyncTaskQueue {
  private queue: (() => Promise<void>)[] = [];

  private activeCount: number = 0;

  private isPaused: boolean = false;

  private readonly concurrencyLimit: number;

  constructor(concurrencyLimit: number) {
    this.concurrencyLimit = concurrencyLimit;
  }

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          resolve(await task());
        } catch (error) {
          reject(error);
        } finally {
          this.activeCount--;

          this.processQueue();
        }
      };

      this.queue.push(wrappedTask);

      this.processQueue();
    });
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;

    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.activeCount < this.concurrencyLimit && this.queue.length > 0 && !this.isPaused) {
      const task = this.queue.shift();

      if (task) {
        this.activeCount++;

        task();
      }
    }
  }
}

const queue = new AsyncTaskQueue(2);

const task1 = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      console.log("Task 1 completed");
      resolve("Result 1");
    }, 2000);
  });

const task2 = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      console.log("Task 2 completed");
      resolve("Result 2");
    }, 1000);
  });

const task3 = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      console.log("Task 3 completed");
      resolve("Result 3");
    }, 1000);
  });

queue
  .enqueue(task1)
  .then((result) => console.log("Task 1 result:", result))
  .catch((error) => console.error("Task 1 error:", error))
  .finally(() => {
    queue.resume();
    console.log("Is Resumed.");
  });

queue.pause();

console.log("Is Paused");

queue
  .enqueue(task2)
  .then((result) => console.log("Task 2 result:", result))
  .catch((error) => console.error("Task 2 error:", error));

queue
  .enqueue(task3)
  .then((result) => console.log("Task 3 result:", result))
  .catch((error) => console.error("Task 3 error:", error));
