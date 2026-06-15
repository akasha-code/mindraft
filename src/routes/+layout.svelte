<script lang="ts">
  import { onMount } from "svelte";
  import { initLocale } from "$lib/i18n";

  let { children } = $props();

  onMount(() => {
    initLocale();
  });
</script>

{@render children()}
