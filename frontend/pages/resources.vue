<template>
  <div>
    <h1>Available Resources:</h1>
    <ShowAllResources />
  </div>
</template>

<script setup lang="ts">
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'Resources';
</script>
