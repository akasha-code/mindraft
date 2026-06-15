<script lang="ts">
  import CoffeeLink from "$components/CoffeeLink.svelte";
  import { APP_AUTHOR } from "$lib/constants/author";
  import { APP_NAME, APP_REPO_URL } from "$lib/constants/brand";
  import { localeState, t } from "$lib/i18n";

  const byLabel = $derived.by(() => {
    void localeState.locale;
    return t("author.by");
  });
</script>

<footer class="app-author-footer">
  <span class="app-author-footer__credit">
    <a
      class="app-author-footer__link"
      href={APP_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {APP_NAME}
    </a>
    · {byLabel}
    <a
      class="app-author-footer__link"
      href={APP_AUTHOR.linkedinUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {APP_AUTHOR.name}
    </a>
  </span>
  <CoffeeLink />
</footer>

<style>
  .app-author-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    flex-shrink: 0;
    min-height: var(--author-footer-height);
    padding: 0.28rem 0.9rem;
    border-top: 1px solid var(--border-hairline);
    background: color-mix(in srgb, var(--bg-surface) 90%, transparent);
    color: var(--text-muted);
    font-size: 0.68rem;
  }

  .app-author-footer__credit {
    color: var(--text-muted);
  }

  .app-author-footer__link {
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .app-author-footer__link:hover {
    color: var(--accent);
  }
</style>
