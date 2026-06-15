<script lang="ts">
  import { APP_AUTHOR } from "$lib/constants/author";
  import { localeState, t } from "$lib/i18n";

  const coffeeLabel = $derived.by(() => {
    void localeState.locale;
    return t("author.coffeeLabel");
  });
  const coffeeAria = $derived.by(() => {
    void localeState.locale;
    return t("author.coffeeAria", { label: coffeeLabel });
  });
  const coffeeQrAlt = $derived.by(() => {
    void localeState.locale;
    return t("author.coffeeQrAlt", { label: coffeeLabel });
  });
</script>

<a
  class="home-coffee-qr"
  href={APP_AUTHOR.coffeeUrl}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={coffeeAria}
  title={coffeeLabel}
>
  <img
    class="home-coffee-qr__image"
    src={APP_AUTHOR.coffeeQrImage}
    alt={coffeeQrAlt}
    width="120"
    height="120"
    loading="lazy"
  />
  <span class="home-coffee-qr__label">{coffeeLabel}</span>
</a>

<style>
  .home-coffee-qr {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    margin-top: 1.5rem;
    padding: 0.55rem;
    border-radius: var(--radius-sm);
    text-decoration: none;
    transition: background 0.18s ease;
  }

  .home-coffee-qr:hover {
    background: var(--bg-hover);
  }

  .home-coffee-qr__image {
    display: block;
    width: 7.5rem;
    height: 7.5rem;
    border-radius: 0.45rem;
    border: 1px solid var(--border-hairline);
    background: #fff;
  }

  .home-coffee-qr__label {
    font-size: 0.78rem;
    color: var(--text-muted);
    transition: color 0.15s ease;
  }

  .home-coffee-qr:hover .home-coffee-qr__label {
    color: var(--accent);
  }
</style>
