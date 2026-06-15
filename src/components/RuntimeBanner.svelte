<script lang="ts">
  import { localeState, t } from "$lib/i18n";
  import { isTauriRuntime } from "$lib/platform/tauri";
  import { showStatusBanner } from "$lib/ui/statusBanner.svelte";

  const browserBannerMessage = $derived.by(() => {
    void localeState.locale;
    return t("runtime.browserBanner");
  });

  $effect(() => {
    if (!isTauriRuntime()) {
      showStatusBanner(browserBannerMessage, "info", 8000);
    }
  });
</script>
