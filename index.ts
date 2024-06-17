import puppeteer, { type Page } from 'puppeteer';

declare global {
  interface Window {
    playPodcastOasisPlaylist?: () => void;
    stopPodcastOasisPlaylist?: () => void;
  }
}

const playPlaylist = (page: Page) => {
  return new Promise<void>(async (resolve, reject) => {
    await page.exposeFunction('playPodcastOasisPlaylist', () => {
      resolve();
    })

    await page.evaluate(() => {
      const target = document.querySelector('[data-testid="play-button"]');

      if (!target) {
        reject('Play button not found');
        return;
      }

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (!(mutation.attributeName === 'aria-label') || !(mutation.target instanceof HTMLElement)) {
            return;
          }

          if (mutation.target.getAttribute('aria-label')?.includes('一時停止')) {
            window.playPodcastOasisPlaylist?.();
          }
        })
      })

      observer.observe(target, { attributes: true });
    })
  })
}

const browser = await puppeteer.launch({
  headless: false,
  ignoreDefaultArgs: ['--disable-component-update']
});

const page = await browser.newPage();

await page.setViewport({ width: 1280, height: 800 });
await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', )

await page.goto('https://open.spotify.com/playlist/0tMC7syYIi0lM5wh6z47fE?si=4182ca3e1ea942a4');

try {
  await page.waitForSelector('#onetrust-close-btn-container button', {
    timeout: 10000,
  });
  await page.click('#onetrust-close-btn-container button');
} catch (error) {
  if (error instanceof Error && error.name !== 'TimeoutError') {
    console.error(error.message);
  }
}

await page.click('[data-testid="login-button"]');

await page.waitForSelector('[data-testid="login-username"]');

await page.type('[data-testid="login-username"]', process.env.SPOTIFY_USERNAME || '');
await page.type('[data-testid="login-password"]', process.env.SPOTIFY_PASSWORD || '');
await page.click('[data-testid="login-remember"]');
await page.click('[data-testid="login-button"]');

await page.waitForSelector('[data-testid="play-button"]');

await playPlaylist(page);

do {
  try {
    await new Promise<void>((resolve) => setTimeout(resolve, 10000));
    await page.click('[data-testid="control-button-skip-forward"]')
  } catch (error) {
    console.error(error);
    break;
  }
} while (true);