<template>
  <a :href="props.url.toString()" class="text-green-300 hover:text-green-400">
    <slot />
  </a>
</template>

<script setup lang="ts">
const props = defineProps<{ url: URL }>();
</script>
