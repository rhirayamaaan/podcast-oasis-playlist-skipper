import puppeteer, { type Page } from "puppeteer";

declare global {
  interface Window {
    playPodcastOasisPlaylist?: () => void;
    goToNextEpisodeInPodcastOasisPlaylist?: () => void;
  }
}

const SPOTIFY_PLAYLIST_URL = process.env.SPOTIFY_PLAYLIST_URL || "";
if (!SPOTIFY_PLAYLIST_URL) {
  throw new Error("SPOTIFY_PLAYLIST_URL is required");
}

const EPISODE_INTERVAL_MILLISECONDS = parseInt(
  process.env.EPISODE_INTERVAL_MILLISECONDS || ""
);

if (
  isNaN(EPISODE_INTERVAL_MILLISECONDS) ||
  !isFinite(EPISODE_INTERVAL_MILLISECONDS)
) {
  throw new Error("EPISODE_INTERVAL_MILLISECONDS is required");
}

const playPlaylist = (page: Page) => {
  return new Promise<void>(async (resolve, reject) => {
    await page.exposeFunction("playPodcastOasisPlaylist", () => {
      resolve();
    });

    await page.evaluate(() => {
      const target = document.querySelector('[data-testid="play-button"]');

      if (!target) {
        reject("Play button not found");
        return;
      }

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            !(mutation.attributeName === "aria-label") ||
            !(mutation.target instanceof HTMLElement)
          ) {
            return;
          }

          if (
            mutation.target.getAttribute("aria-label")?.includes("一時停止")
          ) {
            window.playPodcastOasisPlaylist?.();
            observer.disconnect();
          }
        });
      });

      observer.observe(target, {
        attributes: true,
        attributeFilter: ["aria-label"],
      });
    });
  });
};

const switchEpisode = (page: Page) => {
  return new Promise<void>(async (resolve, reject) => {
    await page.exposeFunction(
      "goToNextEpisodeInPodcastOasisPlaylist",
      async () => {
        await page.click('[data-testid="control-button-skip-forward"]');
      }
    );

    await page.evaluate((episodeInterval) => {
      const target = document.querySelector(
        '[data-testid="now-playing-widget"]'
      );

      if (!target) {
        reject("Playing episode title not found");
        return;
      }

      let nowMillisecond = Date.now();

      const clickSkipForwardButton = () => {
        console.log("clickSkipForwardButton", Date.now() - nowMillisecond);
        window.goToNextEpisodeInPodcastOasisPlaylist?.();
      };

      let timerId = setTimeout(clickSkipForwardButton, episodeInterval);

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          nowMillisecond = Date.now();
          clearTimeout(timerId);

          if (
            !(mutation.attributeName === "aria-label") ||
            !(mutation.target instanceof HTMLElement)
          ) {
            return;
          }

          timerId = setTimeout(clickSkipForwardButton, episodeInterval);
        });
      });

      observer.observe(target, {
        attributes: true,
        attributeFilter: ["aria-label"],
      });
    }, EPISODE_INTERVAL_MILLISECONDS);
  });
};

const browser = await puppeteer.launch({
  headless: false,
  ignoreDefaultArgs: ["--disable-component-update"],
});

const page = await browser.newPage();

await page.setViewport({ width: 1280, height: 800 });
await page.setUserAgent(
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
);

await page.goto(SPOTIFY_PLAYLIST_URL);

try {
  await page.waitForSelector("#onetrust-close-btn-container button", {
    timeout: 10000,
  });
  await page.click("#onetrust-close-btn-container button");
} catch (error) {
  if (error instanceof Error && error.name !== "TimeoutError") {
    console.error(error.message);
  }
}

await page.click('[data-testid="login-button"]');

await page.waitForSelector('[data-testid="login-username"]');

await page.type(
  '[data-testid="login-username"]',
  process.env.SPOTIFY_USERNAME || ""
);
await page.type(
  '[data-testid="login-password"]',
  process.env.SPOTIFY_PASSWORD || ""
);
await page.click('[data-testid="login-remember"]');
await page.click('[data-testid="login-button"]');

await page.waitForSelector('[data-testid="play-button"]');

await playPlaylist(page);

try {
  await switchEpisode(page);
} catch (error) {
  console.error(error);
}
