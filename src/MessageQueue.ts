type MessageQueueOptions = {
  characterIntervalMs?: number;
  messageDurationMs?: number;
  minimumFullDisplayMs?: number;
  hiddenClass?: string;
};

type Message = {
  name: string;
  message: string;
}

export class MessageQueue {
  private readonly queue: Message[] = [];

  private readonly boxElements: HTMLElement[];
  private readonly nameElement: HTMLElement;
  private readonly textElement: HTMLElement;

  private readonly audioPlayer: Function;

  private readonly characterIntervalMs: number;
  private readonly messageDurationMs: number;
  private readonly minimumFullDisplayMs: number;
  private readonly hiddenClass: string;

  private processing = false;

  private abortController: AbortController | null = null;

  public constructor(
    boxElements: HTMLElement[],
    nameElement: HTMLElement,
    textElement: HTMLElement,
    audioPlayer: Function,
    options: MessageQueueOptions = {},
  ) {
    this.boxElements = boxElements;
    this.nameElement = nameElement;
    this.textElement = textElement;
    this.audioPlayer = audioPlayer;

    this.characterIntervalMs = options.characterIntervalMs ?? 66;
    this.messageDurationMs = options.messageDurationMs ?? 14_300;
    this.minimumFullDisplayMs = options.minimumFullDisplayMs ?? 3_000;
    this.hiddenClass = options.hiddenClass ?? "hidden";
  }

  public enqueue(message: Message): void {
    this.queue.push(message);

    if (!this.processing) {
      void this.processQueue();
    }
  }

  public enqueueAll(messages: Iterable<Message>): void {
    for (const message of messages) {
      this.queue.push(message);
    }

    if (!this.processing && this.queue.length > 0) {
      void this.processQueue();
    }
  }

  public clear(): void {
    this.queue.length = 0;
    this.abortController?.abort();
    this.abortController = null;

    this.processing = false;
    this.textElement.textContent = "";
    this.hideBox();
  }

  public completeCurrentMessage(): void {
    this.abortController?.abort();
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    this.showBox();

    try {
      while (this.queue.length > 0) {
        const message = this.queue.shift();

        if (message === undefined) {
          break;
        }

        await this.displayMessage(message);

        const fullDisplayDuration = Math.max(
          this.messageDurationMs,
          this.minimumFullDisplayMs,
        );

        await sleep(fullDisplayDuration);
      }
    } finally {
      this.processing = false;
      this.abortController = null;

      this.hideBox();
    }
  }

  private async displayMessage(message: Message): Promise<void> {
    this.nameElement.textContent = message.name;

    this.textElement.textContent = "";

    const controller = new AbortController();
    this.abortController = controller;

    const characters = Array.from(message.message);

    for (let index = 0; index < characters.length; index += 1) {
      this.audioPlayer();

      if (controller.signal.aborted) {
        this.textElement.textContent = message.message;
        return;
      }

      this.textElement.textContent += characters[index];

      if (index < characters.length - 1) {
        try {
          await sleep(this.characterIntervalMs, controller.signal);
        } catch (error) {
          if (isAbortError(error)) {
            this.textElement.textContent = message.message;
            return;
          }

          throw error;
        }
      }
    }
  }

  private showBox(): void {
    this.boxElements.forEach((element) => {
      element.classList.remove(this.hiddenClass);
    });
  }

  private hideBox(): void {
    this.boxElements.forEach((element) => {
      element.classList.add(this.hiddenClass);
    });
  }
}

function sleep(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, milliseconds);

    const handleAbort = (): void => {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", handleAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
